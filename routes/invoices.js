/** Routes for invoices of BizTime. */

const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const {
  checkNumbers,
  prepareInsertData,
  prepareUpdateData,
} = require("../helperFx");
const {
  dbSelect,
  dbSelectAll,
  dbDelete,
  dbInsert,
  dbUpdate,
} = require("../dbFunctions");
const router = express.Router();

/** GET {/invoices}/ ; return {invoices: [{id, comp_code}, ...]}  */
router.get("/", async function (req, res, next) {
  //  route gets and returns all invoices in the invoices table.
  //
  //  return:
  //      {invoices: [{id, comp_code}, ...]}

  const results = await dbSelectAll("id, comp_code", "invoices");

  if (results.success) {
    return res.json({ invoices: results.sqlReturn });
  } else {
    const errorSelect = new Error(results.error.message);
    errorSelect.status = 400;
    return next(errorSelect);
  }
});

/** GET {/invoices}/[id] ; return {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}} */
router.get("/:id", async function (req, res, next) {
  let idIn;

  const nbrTest = checkNumbers(req.params.id);
  if (nbrTest.numberIsValid) {
    idIn = nbrTest.validatedNumber;
  } else {
    const errorSelect = new Error(`Invoice id ${nbrTest.message}`);
    errorSelect.status = 400;
    return next(errorSelect);
  }

  const selectData = {
    criteria: "id = $1",
    criteriaValues: [idIn],
    selectFields: "id, amt, paid, add_date, paid_date, comp_code",
  };

  const resultsInvoice = await dbSelect(selectData, "invoices");

  if (resultsInvoice.success) {
    selectData.criteria = "code = $1";
    selectData.criteriaValues = [resultsInvoice.sqlReturn.comp_code];
    selectData.selectFields = "code, name, description";

    const resultsCompany = await dbSelect(selectData, "companies");

    if (resultsCompany.success) {
      delete resultsInvoice.sqlReturn.comp_code;
      resultsInvoice.sqlReturn["company"] = resultsCompany.sqlReturn;
    }

    return res.json({ invoice: resultsInvoice.sqlReturn });
  } else {
    if (resultsInvoice.error.message === "not found") {
      const errorSelect = new Error(
        `Invoice '${req.params.id}' was not found.`
      );
      errorSelect.status = 404;
      return next(errorSelect);
    } else {
      const errorSelect = new Error(resultsInvoice.error.message);
      errorSelect.status = 400;
      return next(errorSelect);
    }
  }
});

/** POST {/invoices}/ ; Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}  */
router.post("/", async function (req, res, next) {
  const requiredKeys = ["comp_code", "amt"];
  const optionalKeys = ["paid", "add_date", "paid_date"];

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

  const resultsInsert = await dbInsert(
    resultsPreparation.insertData,
    "invoices",
    `${requiredKeys}`
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

/** PUT {/invoices}/[id] ; returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}   */
router.put("/:id", async function (req, res, next) {
  const verifyNumber = checkNumbers(req.params.id);
  if (verifyNumber.numberIsValid === false) {
    const errorIdNotNumeric = new Error(`Invoice id ${verifyNumber.message}`);
    errorIdNotNumeric.status = 400;
    return next(errorIdNotNumeric);
  }

  const optionalKeys = ["comp_code", "amt", "paid", "paid_date"];

  const resultsPreparation = prepareUpdateData(optionalKeys, req.body);
  if (resultsPreparation.success === false) {
    const errorUpdate = new Error(resultsPreparation.error);
    errorUpdate.status = 404;
    return next(errorUpdate);
  }

  const criteria = {
    pk: "id",
    value: verifyNumber.validatedNumber,
  };
  const resultsUpdate = await dbUpdate(
    criteria,
    resultsPreparation.updateData,
    "invoices"
  );

  if (resultsUpdate.success) {
    return res.json({ invoice: resultsUpdate.sqlReturn });
  } else {
    if (resultsUpdate.error.message === "not found") {
      const errorUpdate = new Error(
        `Invoice '${req.params.id}' was not found.`
      );
      errorSelect.status = 404;
      return next(errorSelect);
    } else {
      const errorSelect = new Error(resultsUpdate.error.message);
      errorSelect.status = 400;
      return next(errorSelect);
    }
  }
  //     Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
});

/** DELETE {/invoices}/[id] ; returns {status: "deleted"}  */
router.delete("/:id", async function (req, res, next) {
  let idIn;

  const nbrTest = checkNumbers(req.params.id);
  if (nbrTest.numberIsValid) {
    idIn = nbrTest.validatedNumber;
  } else {
    const errorDelete = new Error(`Invoice id ${nbrTest.message}`);
    errorDelete.status = 400;
    return next(errorDelete);
  }

  const deleteData = {
    criteria: "id = $1",
    criteriaValues: [idIn],
    argumentsName: "id, amt, paid, add_date, paid_date, comp_code",
  };

  const resultsDelete = await dbDelete(deleteData, "invoices");
  if (resultsDelete.success) {
    return res.json({ deleted: resultsDelete.deleted });
    // return res.json(resultsDelete.message);
  } else {
    if (resultsDelete.error.message === "not found") {
      const errorSelect = new Error(
        `Invoice '${req.params.id}' was not found.`
      );
      errorSelect.status = 404;
      return next(errorSelect);
    } else {
      const errorSelect = new Error(resultsDelete.error.message);
      errorSelect.status = 400;
      return next(errorSelect);
    }
  }
});

module.exports = router;
