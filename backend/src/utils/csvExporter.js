const { Parser } = require('json2csv');

const exportToCSV = (data, fields) => {
  const parser = new Parser({ fields });
  return parser.parse(data);
};

module.exports = exportToCSV;
