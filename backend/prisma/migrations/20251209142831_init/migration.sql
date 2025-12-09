-- CreateTable
CREATE TABLE "datasets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL DEFAULT 'Ranklist',
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_rows" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "rankOrder" INTEGER,
    "firstName" TEXT,
    "lastName" TEXT,
    "rankCategory" TEXT,
    "nbDealsPersonal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nbDealsGlobal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitsBrutPersonal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitsBrutGlobal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitsBrutParallel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coachRank" TEXT,
    "coachFirstName" TEXT,
    "coachLastName" TEXT,
    "fullName" TEXT,
    "coachFullName" TEXT,
    "totalUnits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "column_mappings" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "excelColumnName" TEXT NOT NULL,
    "internalFieldName" TEXT NOT NULL,
    "columnType" TEXT NOT NULL DEFAULT 'string',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "column_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicator_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "groupBy" TEXT NOT NULL,
    "metricField" TEXT NOT NULL,
    "aggregation" TEXT NOT NULL DEFAULT 'sum',
    "filters" JSONB,
    "sortOrder" TEXT NOT NULL DEFAULT 'desc',
    "topN" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indicator_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_results" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ranking_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_rows_datasetId_idx" ON "data_rows"("datasetId");

-- CreateIndex
CREATE INDEX "data_rows_rankCategory_idx" ON "data_rows"("rankCategory");

-- CreateIndex
CREATE INDEX "data_rows_coachFullName_idx" ON "data_rows"("coachFullName");

-- CreateIndex
CREATE UNIQUE INDEX "column_mappings_datasetId_excelColumnName_key" ON "column_mappings"("datasetId", "excelColumnName");

-- CreateIndex
CREATE INDEX "ranking_results_indicatorId_idx" ON "ranking_results"("indicatorId");

-- CreateIndex
CREATE INDEX "ranking_results_datasetId_idx" ON "ranking_results"("datasetId");

-- AddForeignKey
ALTER TABLE "data_rows" ADD CONSTRAINT "data_rows_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "column_mappings" ADD CONSTRAINT "column_mappings_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
