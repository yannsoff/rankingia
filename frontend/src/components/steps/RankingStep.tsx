import { useState } from 'react';
import { ArrowLeft, Settings, Trophy, ArrowUpDown, FileDown } from 'lucide-react';
import { rankingAPI } from '../../services/api';
import type { Dataset, Ranking } from '../../types';

interface RankingStepProps {
  ranking: Ranking;
  dataset: Dataset;
  onBack: () => void;
  onAdjust: () => void;
}

type SortField = 'rank' | 'name' | 'value';
type SortDirection = 'asc' | 'desc';

export default function RankingStep({ ranking, dataset, onBack, onAdjust }: RankingStepProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Sort data
  const sortedData = [...ranking.data].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortField) {
      case 'rank':
        compareValue = a.rank - b.rank;
        break;
      case 'name':
        compareValue = a.name.localeCompare(b.name);
        break;
      case 'value':
        compareValue = a.value - b.value;
        break;
    }
    
    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await rankingAPI.exportPDFDirect(
        ranking.data,
        ranking.indicatorName,
        ranking.description,
        'OVB',
        dataset.originalName
      );

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ranking-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting PDF:', err);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {ranking.indicatorName}
            </h2>
            {ranking.description && (
              <p className="text-gray-600">{ranking.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{ranking.totalRows} résultats</span>
              <span>•</span>
              <span>Fichier : {dataset.originalName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAdjust}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            <Settings className="w-4 h-4" />
            <span>Ajuster</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 text-sm font-medium"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Export...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Exporter PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top 3 Podium (for first page only) */}
      {currentPage === 1 && sortedData.length >= 3 && sortField === 'rank' && sortDirection === 'asc' && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 0, 2].map((idx) => {
            const item = sortedData[idx];
            if (!item) return null;
            
            return (
              <div
                key={item.rank}
                className={`bg-gradient-to-br ${
                  item.rank === 1
                    ? 'from-yellow-50 to-yellow-100 border-yellow-300'
                    : item.rank === 2
                    ? 'from-gray-50 to-gray-100 border-gray-300'
                    : 'from-orange-50 to-orange-100 border-orange-300'
                } border-2 rounded-xl p-4 ${item.rank === 1 ? 'order-2 scale-105' : item.rank === 2 ? 'order-1' : 'order-3'}`}
              >
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                    item.rank === 1 ? 'bg-yellow-400' : item.rank === 2 ? 'bg-gray-400' : 'bg-orange-400'
                  }`}>
                    <span className="text-white font-bold text-lg">{item.rank}</span>
                  </div>
                  <p className="font-bold text-gray-900 mb-1 truncate">{item.name}</p>
                  {item.rankCategory && (
                    <p className="text-xs text-gray-600 mb-2">{item.rankCategory}</p>
                  )}
                  <p className="text-2xl font-bold text-primary-600">
                    {item.value.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">unités</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ranking Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort('rank')}
                >
                  <div className="flex items-center gap-1">
                    <span>Rang</span>
                    {sortField === 'rank' && (
                      <ArrowUpDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    <span>Nom</span>
                    {sortField === 'name' && (
                      <ArrowUpDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                {ranking.groupBy === 'collaborator' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                )}
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Valeur</span>
                    {sortField === 'value' && (
                      <ArrowUpDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row) => (
                <tr key={`${row.rank}-${row.name}`} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-semibold text-sm ${getRankBadgeColor(row.rank)}`}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{row.name}</div>
                  </td>
                  {ranking.groupBy === 'collaborator' && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.rankCategory && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {row.rankCategory}
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {row.value.toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Affichage de {startIndex + 1} à {Math.min(endIndex, sortedData.length)} sur {sortedData.length} résultats
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Précédent
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, idx, arr) => (
                    <div key={page} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm transition ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-300 hover:bg-white'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux indicateurs</span>
        </button>
      </div>
    </div>
  );
}

