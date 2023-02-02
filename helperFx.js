/* helper functions*/

function validateRequired(fieldList, source, allRequired = true) {
  const fields = {};
  let allValid = true;
  let ctr = 0;

  let errorValidation = "";
  let errorDelim = "";

  for (const key of fieldList) {
    if (Object.hasOwnProperty.call(source, key)) {
      // key exists
      if (typeof source[key] === "string") {
        fields[key] = source[key].trim();
      } else {
        fields[key] = source[key];
      }

      ctr++;
    } else {
      if (allRequired) {
        // key is missing and all keys are required
        allValid = false;
        errorValidation = `${errorValidation}${errorDelim}'${key}'`;
        errorDelim = ", ";
      }
    }
  }

  // build and return results
  if (allValid) {
    return {
      allValid: allValid,
      fields: fields,
      nbrOfFields: ctr,
      error: "",
    };
  } else {
    // Field(s) x required. Missing x,y,z.
    errorValidation = `Field(s) ${fieldList} required. Missing ${errorValidation}.`;
    return {
      allValid: allValid,
      fields: {},
      error: errorValidation,
    };
  }
}

function prepareInsertData(requiredKeys, optionalKeys, requestBody) {
  const resultsValidation = validateRequired(requiredKeys, requestBody);

  if (resultsValidation.allValid === false) {
    return {
      success: false,
      error: resultsValidation["error"],
    };
  }

  const insertValues = [];
  let ctr = 1;
  let insertArgs = "";
  let insertNames = "";
  let insertDelim = "";
  for (const key of requiredKeys) {
    insertValues.push(resultsValidation.fields[key]);
    // build the argument string, $1, $2, ...
    //  insertArgs string each time through the loop.
    insertArgs = `${insertArgs}${insertDelim}$${ctr}`;
    insertNames = `${insertNames}${insertDelim}${key}`;
    ctr++;
    insertDelim = ", ";
  }

  if (optionalKeys.length > 0) {
    // check whether a value exists for the optional key in requestBody.
    let tester;
    for (const key of optionalKeys) {
      if (Object.hasOwnProperty.call(requestBody, key)) {
        // optionalKeys were not validated so we need to check them
        if (typeof requestBody[key] === "string") {
          // We have a string. trim and save it when it has a non-zero length.
          tester = requestBody[key].trim();
          if (tester.length > 0) {
            insertValues.push(tester);
            // the args, names, and ctr stuff are duplicated because
            //  after trimming, we may have an empty string which we
            //  can ignore.
            insertArgs = `${insertArgs}${insertDelim}$${ctr}`;
            insertNames = `${insertNames}${insertDelim}${key}`;
            ctr++;
            insertDelim = ", ";
          }
        } else {
          insertValues.push(requestBody[key]);
          insertArgs = `${insertArgs}${insertDelim}$${ctr}`;
          insertNames = `${insertNames}${insertDelim}${key}`;
          ctr++;
          insertDelim = ", ";
        }
      }
    }
  }

  return {
    success: true,
    insertData: {
      argumentsNbr: insertArgs,
      argumentsName: insertNames,
      argumentsValues: insertValues,
    },
  };
}

function prepareUpdateData(requestKeys, requestBody) {
  // validate the request keys. Third parm is false because all requestKeys are NOT required.
  const resultsValidation = validateRequired(requestKeys, requestBody, false);

  if (resultsValidation.nbrOfFields === 0) {
    let fields = "";
    let fieldsDelim = "";
    let ctr = 1;
    for (const field of requestKeys) {
      fields = `${fields}${fieldsDelim}'${field}'`;
      if (ctr + 1 === requestKeys.length) {
        fieldsDelim = `${fieldsDelim} or `.replace("  ", " ");
      } else {
        fieldsDelim = ", ";
      }
      ctr++;
    }
    return {
      success: false,
      error: `Field(s) ${fields} are needed for an update. No fields were provided.`,
    };
  }

  const insertValues = [];
  const fieldValues = [];
  const fieldNames = [];
  const updateArgs = [];
  let ctr = 1;
  for (const key in resultsValidation.fields) {
    // console.log(`for: ctr=${ctr}, key=${key}, resultsValidation.fields[key]= ${resultsValidation.fields[key]}`)
    fieldValues.push(resultsValidation.fields[key]);
    fieldNames.push(key);
    updateArgs.push(`$${ctr}`);
    ctr++;
  }

  return {
    success: true,
    updateData: {
      argumentsNbr: updateArgs,
      argumentsName: fieldNames,
      argumentsValues: fieldValues,
    },
  };
}

function checkNumbers(inNumber) {
  const results = {};

  let nbrText = inNumber * 1;
  if (isNaN(nbrText)) {
    results["numberIsValid"] = false;
    results[
      "message"
    ] = `'${inNumber}' is invalid. '${inNumber}' is not a number.`;
    return results;
  }

  results["numberIsValid"] = true;
  results["validatedNumber"] = inNumber * 1;

  return results;
}

function buildIndPlusComp(arr) {
  const outValues = arr.reduce(function (arrAccum, arrNext) {
    if (arrAccum.length > 0) {
      if (arrAccum[arrAccum.length - 1].code === arrNext.code) {
        if (arrNext.comp_code !== null) {
          arrAccum[arrAccum.length - 1].companies.push(arrNext.comp_code);
        }

        return arrAccum;
      } else {
        const nextIndustry = {
          code: arrNext.code,
          industry: arrNext.industry,
          companies: [],
        };
        if (arrNext.comp_code !== null) {
          nextIndustry.companies.push(arrNext.comp_code);
        }

        return arrAccum.concat(nextIndustry);
      }
    } else {
      const nextIndustry = {
        code: arrNext.code,
        industry: arrNext.industry,
        companies: [],
      };
      if (arrNext.comp_code !== null) {
        nextIndustry.companies.push(arrNext.comp_code);
      }

      return arrAccum.concat(nextIndustry);
    }
  }, []);

  return outValues;
}

module.exports = {
  buildIndPlusComp: buildIndPlusComp,
  checkNumbers: checkNumbers,
  prepareInsertData: prepareInsertData,
  prepareUpdateData: prepareUpdateData,
  validateRequired: validateRequired,
};
