/** Database insert, update, select, and delete functions for BizTime. */

const db = require("./db");
const ExpressError = require("./expressError");
const { buildIndPlusComp } = require("./helperFx");

async function dbSelectAll(selectFields, table) {
  return new Promise(async function (resolve, reject) {
    let dbCall = db.query(`
            SELECT ${selectFields} 
            FROM ${table}  
        `);

    dbCall
      .then((data) =>
        resolve({
          success: true,
          sqlReturn: data.rows,
          error: { message: "" },
        })
      )
      .catch((err) =>
        resolve({
          success: false,
          sqlReturn: "",
          error: {
            message: err,
          },
        })
      );
  });
}

async function dbSelectIndustryJoin(
  selectData = { criteria: "", criteriaValues: [] }
) {
  return new Promise(async function (resolve, reject) {
    let dbCall = db.query(
      `
            SELECT ind.code, ind.industry, comp.code AS comp_code
            FROM industries AS ind 
            LEFT JOIN companies_industries AS ci ON ind.code = ci.ind_code
            LEFT JOIN companies AS comp ON comp.code = ci.comp_code 
            ${selectData.criteria} 
        `,
      selectData.criteriaValues
    );

    dbCall
      .then((data) => {
        const indCompArray = buildIndPlusComp(data.rows);

        resolve({
          success: true,
          sqlReturn: indCompArray,
          error: { message: "" },
        });
      })
      .catch((err) =>
        resolve({
          success: false,
          sqlReturn: "",
          error: {
            message: err,
          },
        })
      );
  });
}

async function dbSelect(selectData, table) {
  return new Promise(async function (resolve, reject) {
    let dbCall = db.query(
      `
            SELECT ${selectData.selectFields} 
            FROM ${table} 
            WHERE ${selectData.criteria} 
        `,
      selectData.criteriaValues
    );

    dbCall
      .then((data) => {
        if (data.rows.length > 0) {
          if (data.rows.length === 1) {
            resolve({
              success: true,
              sqlReturn: data.rows[0],
              error: { message: "" },
            });
          } else {
            resolve({
              success: true,
              sqlReturn: data.rows,
              error: { message: "" },
            });
          }
        } else {
          // no rows returned
          resolve({
            success: false,
            sqlReturn: "",
            error: {
              message: "not found",
            },
          });
        }
      })
      .catch((err) =>
        resolve({
          success: false,
          sqlReturn: "",
          error: {
            message: err,
          },
        })
      );
  });
}

async function dbInsert(insertData, table, returnFields = "*") {
  return new Promise(async function (resolve, reject) {
    let result;
    try {
      result = await db.query(
        `
                INSERT INTO ${table} (${insertData.argumentsName})  
                VALUES (${insertData.argumentsNbr}) 
                RETURNING ${returnFields} 
            `,
        insertData.argumentsValues
      );

      resolve({
        success: true,
        sqlReturn: result.rows[0],
        error: {
          message: "",
        },
      });
    } catch (err) {
      // result = error;
      resolve({
        success: false,
        insertReturn: "",
        error: {
          message: err,
        },
      });

      // reject(
      //     {
      //         success: false,
      //         insertReturn: "",
      //         error: {
      //             message: err
      //         }
      //     }
      // );
    }
  });
}

async function dbUpdate(whereCriteria, updateData, table) {
  let setClause = "";
  let returningClause = `${whereCriteria.pk}, `;
  let delim = "";
  let idx = 0;
  for (field of updateData.argumentsName) {
    setClause = `${setClause}${delim}${field} = ${updateData.argumentsNbr[idx]}`;
    returningClause = `${returningClause}${delim}${field}`;
    delim = ", ";
    idx++;
  }
  // where clause is 'pk' = $x
  // updateData.argumentsNbr has all the $ parameters for the set clause. The length
  //  of the array + 1 is the parameter value for the where.
  let whereClause = `${whereCriteria.pk} = $${
    updateData.argumentsNbr.length + 1
  }`;
  // argumentsValues align with parameterized $s. Need to include the where value too!
  updateData.argumentsValues.push(whereCriteria.value);

  // return a new Promise
  return new Promise(async function (resolve, reject) {
    let result;
    try {
      result = await db.query(
        `
                UPDATE ${table} 
                SET ${setClause} 
                WHERE ${whereClause}
                RETURNING ${returningClause} 
            `,
        updateData.argumentsValues
      );

      if (result.rows.length > 0) {
        resolve({
          success: true,
          sqlReturn: result.rows[0],
          error: { message: "" },
        });
      } else {
        resolve({
          success: false,
          sqlReturn: {},
          error: { message: "not found" },
        });
      }
    } catch (err) {
      resolve({
        success: false,
        sqlReturn: "",
        error: {
          message: err,
        },
      });
    }
  });
}

async function dbDelete(deleteData, table) {
  // return a new Promise
  return new Promise(async function (resolve, reject) {
    let result;
    try {
      result = await db.query(
        `
                DELETE FROM ${table}  
                WHERE ${deleteData.criteria} 
                RETURNING ${deleteData.argumentsName}
            `,
        deleteData.criteriaValues
      );

      if (result.rows.length > 0) {
        resolve({
          success: true,
          message: { status: "deleted" },
          deleted: result.rows,
          error: { message: "" },
        });
      } else {
        resolve({
          success: false,
          message: {},
          error: { message: "not found" },
        });
      }
    } catch (err) {
      // result = error;
      resolve({
        success: false,
        message: {},
        error: {
          message: err,
        },
      });
    }
  });
}

module.exports = {
  dbDelete: dbDelete,
  dbInsert: dbInsert,
  dbSelect: dbSelect,
  dbSelectAll: dbSelectAll,
  dbSelectIndustryJoin: dbSelectIndustryJoin,
  dbUpdate: dbUpdate,
};
