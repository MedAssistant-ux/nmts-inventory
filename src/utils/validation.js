export const VERIFIERS = ["Joshua Belcher", "Johana Olveda", "Adelina Diaz"];

export function validateOpenSection(data) {
  const errors = [];

  if (!data.open_bulk_full && data.open_bulk_full !== 0) {
    errors.push("Enter the number of full bottles");
  }
  if (data.open_unit_methasoft == null || data.open_unit_methasoft === '') {
    errors.push("Enter Unit Totals - Methasoft count");
  }
  if (data.open_unit_actual == null || data.open_unit_actual === '') {
    errors.push("Enter Unit Totals - Actual count");
  }

  const variance = (Number(data.open_unit_actual) || 0) - (Number(data.open_unit_methasoft) || 0);
  if (variance !== 0 && (!data.open_unit_notes || data.open_unit_notes.trim() === '')) {
    errors.push("Variance notes are required when there is a variance");
  }

  if (!data.open_unit_total_mgs && data.open_unit_total_mgs !== 0) {
    errors.push("Enter Unit Total Mgs");
  }
  if (!data.open_verified_by_1) {
    errors.push("Select Verified By");
  }

  return errors;
}

export function validateCloseSection(data) {
  const errors = [];

  if (!data.close_bulk_full && data.close_bulk_full !== 0) {
    errors.push("Enter the number of full bottles");
  }
  if (data.close_unit_methasoft == null || data.close_unit_methasoft === '') {
    errors.push("Enter Unit Totals - Methasoft count");
  }
  if (data.close_unit_actual == null || data.close_unit_actual === '') {
    errors.push("Enter Unit Totals - Actual count");
  }

  const variance = (Number(data.close_unit_actual) || 0) - (Number(data.close_unit_methasoft) || 0);
  if (variance !== 0 && (!data.close_unit_notes || data.close_unit_notes.trim() === '')) {
    errors.push("Variance notes are required when there is a variance");
  }

  if (!data.close_unit_total_mgs && data.close_unit_total_mgs !== 0) {
    errors.push("Enter Unit Total Mgs");
  }
  if (data.dispensed_amount == null || data.dispensed_amount === '') {
    errors.push("Enter Total Amount Dispensed");
  }

  const wasteAmt = Number(data.waste_amount) || 0;
  if (wasteAmt > 0) {
    if (!data.waste_printed) errors.push("Confirm: printed the spill/waste paper");
    if (!data.waste_logged) errors.push("Confirm: recorded spill/waste in logbook");
  }

  if (!data.close_verified_by_1) {
    errors.push("Select Verified By");
  }
  if (!data.pharmacist_pouring) {
    errors.push("Answer: Is the Pharmacist still pouring?");
  }

  return errors;
}

export function calcBulkTotal(bulkFull, partials) {
  const fullMgs = (Number(bulkFull) || 0) * 10000;
  const partialsSum = (partials || []).reduce((s, v) => s + (Number(v) || 0), 0);
  return fullMgs + partialsSum;
}

export function calcVariance(methasoft, actual) {
  if (methasoft === '' || methasoft == null || actual === '' || actual == null) return 0;
  return (Number(actual) || 0) - (Number(methasoft) || 0);
}

export function calcGrandTotal(bulkFull, partials, unitTotalMgs) {
  return calcBulkTotal(bulkFull, partials) + (Number(unitTotalMgs) || 0);
}
