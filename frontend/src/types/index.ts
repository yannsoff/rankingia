export interface Dataset {
  id: string;
  filename: string;
  originalName: string;
  sheetName: string;
  uploadDate: string;
  rowCount: number;
}

export interface DataRow {
  id: string;
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

export interface ColumnMapping {
  id: string;
  datasetId: string;
  excelColumnName: string;
  internalFieldName: string;
  columnType: string;
  isActive: boolean;
}

export interface SpecialOperation {
  targetCollaboratorId: string;
  targetCollaboratorName?: string; // Name for matching when IDs change
  subtractCollaboratorIds: string[];
  subtractCollaboratorNames?: string[]; // Names for matching when IDs change
}

export interface IndicatorDefinition {
  id: string;
  name: string;
  description: string | null;
  type: 'predefined' | 'custom';
  rankingMode?: 'standard' | 'mixedRanks' | 'singleRankSelection';
  groupBy: string;
  metricField: string;
  aggregation: string;
  filters: any;
  sortOrder: string;
  topN: number | null;
  // Advanced ranking fields
  selectedRanks?: string[];
  specialOperations?: SpecialOperation[];
  includedCollaboratorIds?: string[];
  excludedCollaboratorIds?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  rankCategory: string | null;
  unitsBrutPersonal: number;
  unitsBrutGlobal: number;
  unitsBrutParallel: number;
  totalUnits: number;
  nbDealsPersonal: number;
  nbDealsGlobal: number;
}

export interface RankingRow {
  rank: number;
  name: string;
  rankCategory?: string;
  value: number;
  details?: any;
}

export interface Ranking {
  indicatorName: string;
  description?: string;
  groupBy: string;
  metricField: string;
  aggregation: string;
  totalRows: number;
  data: RankingRow[];
}

export interface Stats {
  totalRows: number;
  totalUnitsBrutPersonal: number;
  totalUnitsBrutGlobal: number;
  totalUnitsBrutParallel: number;
  totalUnits: number;
  avgUnitsPerCollaborator?: number;
  uniqueRankCategories: number;
  uniqueCoaches: number;
  rankCategoryBreakdown?: Record<string, number>;
  topCoaches?: Array<{ name: string; totalUnits: number }>;
}

