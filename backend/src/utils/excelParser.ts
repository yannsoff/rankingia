import xlsx from 'xlsx';

export interface ParsedRow {
  // Original column values
  [key: string]: any;
}

export interface NormalizedRow {
  rankOrder: number | null;
  firstName: string | null;
  lastName: string | null;
  rankCategory: string | null;
  nbDealsPersonal: number;
  nbDealsGlobal: number;
  unitsBrutPersonal: number;
  unitsBrutGlobal: number;
  unitsBrutParallel: number;
  coachRank: string | null;
  coachFirstName: string | null;
  coachLastName: string | null;
  fullName: string | null;
  coachFullName: string | null;
  totalUnits: number;
}

export interface ParsedExcelData {
  sheetName: string;
  headers: string[];
  rows: ParsedRow[];
  normalizedRows: NormalizedRow[];
  columnMapping: Map<string, string>;
}

/**
 * Column name normalization mapping
 */
const COLUMN_MAPPING: { [key: string]: string } = {
  'Classement': 'rankOrder',
  'Prénom': 'firstName',
  'Nom': 'lastName',
  'Rang': 'rankCategory',
  'Rang coach': 'coachRank',
  'Prénom du coach': 'coachFirstName',
  'Nom du coach': 'coachLastName',
};

/**
 * Normalize a column name to internal field name
 */
export function normalizeColumnName(columnName: string): string {
  // Try exact match first
  if (COLUMN_MAPPING[columnName]) {
    return COLUMN_MAPPING[columnName];
  }
  
  // Try with trimmed and case-insensitive match
  const trimmed = columnName.trim();
  for (const [key, value] of Object.entries(COLUMN_MAPPING)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) {
      return value;
    }
  }
  
  // If no match, return a sanitized version of the column name
  return columnName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_{2,}/g, '_');
}

/**
 * Check if a row is a section header (should be ignored)
 */
export function isSectionHeader(row: ParsedRow): boolean {
  const classement = row['Classement'] || row['classement'];
  
  if (typeof classement === 'string') {
    // Check if it contains "Ordre de classement"
    if (classement.includes('Ordre de classement') || 
        classement.includes('ordre de classement')) {
      return true;
    }
  }
  
  // Also check if firstName and lastName are both empty
  const firstName = row['Prénom'] || row['prénom'] || row['firstName'];
  const lastName = row['Nom'] || row['nom'] || row['lastName'];
  
  if (!firstName && !lastName && typeof classement === 'string') {
    return true;
  }
  
  return false;
}

/**
 * Convert a value to a number, defaulting to 0 if invalid
 */
export function toNumber(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

/**
 * Normalize a single row to internal structure
 */
export function normalizeRow(row: ParsedRow): NormalizedRow | null {
  // Skip section headers
  if (isSectionHeader(row)) {
    return null;
  }
  
  // Extract basic fields
  const firstName = row['Prénom'] || row['prénom'] || null;
  const lastName = row['Nom'] || row['nom'] || null;
  const rankCategory = row['Rang'] || row['rang'] || null;
  
  // Skip rows without collaborator information
  if (!firstName && !lastName) {
    return null;
  }
  
  if (!rankCategory) {
    return null;
  }
  
  // Extract numeric fields
  const nbDealsPersonal = toNumber(
    row['Nbre d\'affaires\n(perso)'] || 
    row['Nbre d\'affaires (perso)']
  );
  
  const nbDealsGlobal = toNumber(
    row['Nbre d\'affaires\n(global)'] || 
    row['Nbre d\'affaires (global)']
  );
  
  const unitsBrutPersonal = toNumber(
    row['Unités brutes \n(perso)'] || 
    row['Unités brutes\n(perso)'] || 
    row['Unités brutes (perso)']
  );
  
  const unitsBrutGlobal = toNumber(
    row['Unités brutes\n(global)'] || 
    row['Unités brutes (global)']
  );
  
  const unitsBrutParallel = toNumber(
    row['Unités brutes\n(parallèles)'] || 
    row['Unités brutes (parallèles)']
  );
  
  // Extract coach information
  const coachRank = row['Rang coach'] || row['rang coach'] || null;
  const coachFirstName = row['Prénom du coach'] || row['prénom du coach'] || null;
  const coachLastName = row['Nom du coach'] || row['nom du coach'] || null;
  
  // Compute derived fields
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const coachFullName = [coachFirstName, coachLastName].filter(Boolean).join(' ') || null;
  const totalUnits = unitsBrutPersonal + unitsBrutGlobal + unitsBrutParallel;
  
  // Extract rank order (if present)
  let rankOrder: number | null = null;
  const classementValue = row['Classement'] || row['classement'];
  if (classementValue !== null && classementValue !== undefined) {
    const parsed = parseInt(String(classementValue), 10);
    if (!isNaN(parsed)) {
      rankOrder = parsed;
    }
  }
  
  return {
    rankOrder,
    firstName,
    lastName,
    rankCategory,
    nbDealsPersonal,
    nbDealsGlobal,
    unitsBrutPersonal,
    unitsBrutGlobal,
    unitsBrutParallel,
    coachRank,
    coachFirstName,
    coachLastName,
    fullName,
    coachFullName,
    totalUnits
  };
}

/**
 * Parse an Excel file and return structured data
 */
export function parseExcelFile(filePath: string, sheetName: string = 'Ranklist'): ParsedExcelData {
  // Read the workbook
  const workbook = xlsx.readFile(filePath);
  
  // Get the specified sheet or the first sheet
  let worksheet: xlsx.WorkSheet;
  if (workbook.SheetNames.includes(sheetName)) {
    worksheet = workbook.Sheets[sheetName];
  } else {
    console.warn(`Sheet "${sheetName}" not found, using first sheet: ${workbook.SheetNames[0]}`);
    worksheet = workbook.Sheets[workbook.SheetNames[0]];
    sheetName = workbook.SheetNames[0];
  }
  
  // Convert to JSON
  const rawData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: null });
  
  // Extract headers
  const headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
  
  // Build column mapping
  const columnMapping = new Map<string, string>();
  headers.forEach(header => {
    columnMapping.set(header, normalizeColumnName(header));
  });
  
  // Normalize rows
  const normalizedRows: NormalizedRow[] = [];
  for (const row of rawData) {
    const normalized = normalizeRow(row);
    if (normalized) {
      normalizedRows.push(normalized);
    }
  }
  
  return {
    sheetName,
    headers,
    rows: rawData,
    normalizedRows,
    columnMapping
  };
}

/**
 * Parse a CSV file (treat it as Excel)
 */
export function parseCSVFile(filePath: string): ParsedExcelData {
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const sheetName = workbook.SheetNames[0];
  
  const rawData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: null });
  const headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
  
  const columnMapping = new Map<string, string>();
  headers.forEach(header => {
    columnMapping.set(header, normalizeColumnName(header));
  });
  
  const normalizedRows: NormalizedRow[] = [];
  for (const row of rawData) {
    const normalized = normalizeRow(row);
    if (normalized) {
      normalizedRows.push(normalized);
    }
  }
  
  return {
    sheetName,
    headers,
    rows: rawData,
    normalizedRows,
    columnMapping
  };
}

