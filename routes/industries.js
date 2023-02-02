/** Routes for industries for BizTime. */

const db = require("../db");
const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError");
const { prepareInsertData } = require("../helperFx");
const { dbSelectIndustryJoin, dbInsert } = require("../dbFunctions");
const router = express.Router();

/** GET {/industries}/ ; return {industries: [{code, industry, companies: [code, ...]}, ...]}  */
router.get("/", async function (req, res, next) {
  const results = await dbSelectIndustryJoin();

  if (results.success) {
    return res.json({ industries: results.sqlReturn });
  } else {
    const errorSelect = new Error(results.error.message);
    errorSelect.status = 400;
    return next(errorSelect);
  }
});

/** POST {/industries}/[code] ; return {industry: {code, industry, companies: [code, ...]}} */
router.post("/:code", async function (req, res, next) {
  const requiredKeys = ["code"];
  const optionalKeys = [];

  const indCode = req.params.code;

  const resultsPreparation = prepareInsertData(
    requiredKeys,
    optionalKeys,
    req.body
  );
  if (resultsPreparation.success === false) {
    const errorValidation = new Error(resultsPreparation.error);
    errorValidation.status = 400;
    return next(errorValidation);
  }

  // add the indCode to the argumentsNbr, argumentsName, and argumentsValues
  let nbrOfValues = resultsPreparation.insertData.argumentsValues.length + 1;
  resultsPreparation.insertData.argumentsNbr = `${resultsPreparation.insertData.argumentsNbr}, $${nbrOfValues}`;

  resultsPreparation.insertData.argumentsName = `comp_code, ind_code`;
  resultsPreparation.insertData.argumentsValues.push(indCode);

  const resultsInsert = await dbInsert(
    resultsPreparation.insertData,
    "companies_industries",
    resultsPreparation.insertData.argumentsName
  );

  if (resultsInsert.success) {
    // successful insert - select to get the companies.
    const selectData = {
      criteria: "WHERE ind.code = $1",
      criteriaValues: [indCode],
    };
    const results = await dbSelectIndustryJoin(selectData);
    if (results.success) {
      return res.status(201).json({ industry: results.sqlReturn });
    } else {
      const errorSelect = new Error(results.error.message);
      errorSelect.status = 400;
      return next(errorSelect);
    }
  } else {
    const errorInsert = new Error(resultsInsert.error.message);
    errorInsert.status = 400;
    return next(errorInsert);
  }
});

/** POST {/industries}/ ; Returns: {industry: {code, industry}}  */
router.post("/", async function (req, res, next) {
  const requiredKeys = ["industry"];
  const optionalKeys = [];

  const resultsPreparation = prepareInsertData(
    requiredKeys,
    optionalKeys,
    req.body
  );
  if (resultsPreparation.success === false) {
    const errorValidation = new Error(resultsPreparation.error);
    errorValidation.status = 400;
    return next(errorValidation);
  }

  let code = slugify(resultsPreparation.insertData.argumentsValues[0], {
    replacement: "-", // replace spaces with replacement character, defaults to `-`
    lower: true, // convert to lower case, defaults to `false`
    locale: "en", // language code of the locale to use
  });

  // add the code to the argumentsNbr, argumentsName, and argumentsValues
  let nbrOfValues = resultsPreparation.insertData.argumentsValues.length + 1;
  resultsPreparation.insertData.argumentsNbr = `${resultsPreparation.insertData.argumentsNbr}, $${nbrOfValues}`;
  resultsPreparation.insertData.argumentsName = `${resultsPreparation.insertData.argumentsName}, code`;
  resultsPreparation.insertData.argumentsValues.push(code);

  const resultsInsert = await dbInsert(
    resultsPreparation.insertData,
    "industries",
    `code, ${requiredKeys}`
  );

  if (resultsInsert.success) {
    // successful insert - return results
    return res.json({ invoice: resultsInsert.sqlReturn });
  } else {
    const errorInsert = new Error(resultsInsert.error.message);
    errorInsert.status = 400;
    return next(errorInsert);
  }
});

module.exports = router;
