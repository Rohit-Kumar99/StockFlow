const { Parser } = require('json2csv');

const exportToCSV = (data, fields) => {
  try {
    const parser = new Parser({ fields });
    return parser.parse(data);
  } catch (error) {
    throw new Error(`CSV export failed: ${error.message}`);
  }
};

module.exports = exportToCSV;
