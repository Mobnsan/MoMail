import { read, utils } from 'xlsx';
import Papa from 'papaparse';

export async function parseContactFile(file) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.csv')) {
    return parseCsv(file);
  }

  return parseXlsx(file);
}

function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        resolve(results.data || []);
      },
      error: (error) => reject(error),
    });
  });
}

function parseXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result;
        const workbook = read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = utils.sheet_to_json(sheet, { defval: '' });
        resolve(rows || []);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Unable to read spreadsheet file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
