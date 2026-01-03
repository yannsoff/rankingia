import { useState, useEffect } from 'react';
import { X, AlertCircle, Search, Plus, Trash2, PlayCircle } from 'lucide-react';
import { collaboratorAPI, indicatorAPI, rankingAPI } from '../../services/api';
import type { Collaborator, Dataset, Ranking } from '../../types';

interface SingleRankModalProps {
  dataset: Dataset;
  onClose: () => void;
  onRankingComputed: (ranking: Ranking) => void;
}

export default function SingleRankModal({
  dataset,
  onClose,
  onRankingComputed
}: SingleRankModalProps) {
  const [availableRanks, setAvailableRanks] = useState<string[]>([]);
  const [selectedRank, setSelectedRank] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCollaborators, setAvailableCollaborators] = useState<Collaborator[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<Collaborator[]>([]);
  const [metricField, setMetricField] = useState('totalUnits');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState('');

  // Load available ranks on mount
  useEffect(() => {
    loadAvailableRanks();
  }, []);

  // Load collaborators when rank changes
  useEffect(() => {
    if (selectedRank) {
      loadCollaborators();
    }
  }, [selectedRank]);

  // Search collaborators when search term changes
  useEffect(() => {
    if (selectedRank) {
      searchCollaborators();
    }
  }, [searchTerm]);

  const loadAvailableRanks = async () => {
    setIsLoading(true);
    try {
      const response = await collaboratorAPI.getRanks(dataset.id);
      setAvailableRanks(response.data.ranks);
    } catch (err: any) {
      console.error('Error loading ranks:', err);
      setError('Erreur lors du chargement des rangs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollaborators = async () => {
    setIsSearching(true);
    try {
      const response = await collaboratorAPI.search(dataset.id, selectedRank);
      setAvailableCollaborators(response.data.collaborators);
    } catch (err: any) {
      console.error('Error loading collaborators:', err);
      setError('Erreur lors du chargement des collaborateurs');
    } finally {
      setIsSearching(false);
    }
  };

  const searchCollaborators = async () => {
    if (!selectedRank) return;

    setIsSearching(true);
    try {
      const response = await collaboratorAPI.search(
        dataset.id,
        selectedRank,
        searchTerm || undefined
      );
      setAvailableCollaborators(response.data.collaborators);
    } catch (err: any) {
      console.error('Error searching collaborators:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCollaborator = (collab: Collaborator) => {
    // Check if already added
    if (selectedCollaborators.find(c => c.id === collab.id)) {
      return;
    }
    setSelectedCollaborators([...selectedCollaborators, collab]);
  };

  const handleRemoveCollaborator = (collabId: string) => {
    setSelectedCollaborators(selectedCollaborators.filter(c => c.id !== collabId));
  };

  const handleCompute = async () => {
    if (!name.trim()) {
      setError('Le nom du ranking est requis');
      return;
    }
    
    if (!selectedRank) {
      setError('Sélectionnez un rang');
      return;
    }
    
    if (selectedCollaborators.length === 0) {
      setError('Sélectionnez au moins un collaborateur');
      return;
    }

    setIsComputing(true);
    setError('');

    try {
      // Create indicator definition
      const indicatorData = {
        name,
        description,
        type: 'custom' as const,
        rankingMode: 'singleRankSelection' as const,
        groupBy: 'collaborator',
        metricField,
        aggregation: 'sum',
        sortOrder: 'desc',
        selectedRanks: [selectedRank],
        includedCollaboratorIds: selectedCollaborators.map(c => c.id),
      };

      const createResponse = await indicatorAPI.create(indicatorData);
      const indicatorId = createResponse.data.indicator.id;

      // Compute ranking
      const rankingResponse = await rankingAPI.compute(indicatorId, dataset.id);
      onRankingComputed(rankingResponse.data.ranking);
      onClose();
    } catch (err: any) {
      console.error('Error computing ranking:', err);
      setError(err.response?.data?.error || 'Erreur lors du calcul du ranking');
    } finally {
      setIsComputing(false);
    }
  };

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      unitsBrutPersonal: 'Unités brutes perso',
      unitsBrutGlobal: 'Unités brutes global',
      unitsBrutParallel: 'Unités brutes parallèles',
      totalUnits: 'Unités totales (perso + global + parallèles)',
      nbDealsPersonal: 'Nombre d\'affaires perso',
      nbDealsGlobal: 'Nombre d\'affaires global',
    };
    return labels[metric] || metric;
  };

  // Filter out already selected collaborators from available list
  const filteredAvailableCollaborators = availableCollaborators.filter(
    collab => !selectedCollaborators.find(c => c.id === collab.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Ranking avec sélection manuelle</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du ranking *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Top FA sélectionnés"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle du ranking..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
              />
            </div>
          </div>

          {/* Rank Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélection du rang *
            </label>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <select
                value={selectedRank}
                onChange={(e) => {
                  setSelectedRank(e.target.value);
                  setSelectedCollaborators([]);
                  setSearchTerm('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">-- Choisir un rang --</option>
                {availableRanks.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            )}
          </div>

          {/* Metric Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Métrique à utiliser *
            </label>
            <select
              value={metricField}
              onChange={(e) => setMetricField(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="totalUnits">{getMetricLabel('totalUnits')}</option>
              <option value="unitsBrutPersonal">{getMetricLabel('unitsBrutPersonal')}</option>
              <option value="unitsBrutGlobal">{getMetricLabel('unitsBrutGlobal')}</option>
              <option value="unitsBrutParallel">{getMetricLabel('unitsBrutParallel')}</option>
              <option value="nbDealsPersonal">{getMetricLabel('nbDealsPersonal')}</option>
              <option value="nbDealsGlobal">{getMetricLabel('nbDealsGlobal')}</option>
            </select>
          </div>

          {/* Collaborator Selection */}
          {selectedRank && (
            <div className="grid grid-cols-2 gap-4">
              {/* Available Collaborators */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Collaborateurs disponibles
                </h4>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* List */}
                {isSearching ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-1">
                    {filteredAvailableCollaborators.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {searchTerm ? 'Aucun résultat' : 'Tous les collaborateurs ont été ajoutés'}
                      </p>
                    ) : (
                      filteredAvailableCollaborators.map(collab => (
                        <div
                          key={collab.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 transition"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{collab.fullName}</p>
                            <p className="text-xs text-gray-500">
                              {collab.totalUnits.toFixed(0)} unités
                            </p>
                          </div>
                          <button
                            onClick={() => handleAddCollaborator(collab)}
                            className="p-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition flex-shrink-0"
                            title="Ajouter"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Collaborators */}
              <div className="border border-primary-200 bg-primary-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Collaborateurs sélectionnés ({selectedCollaborators.length})
                </h4>

                <div className="max-h-80 overflow-y-auto space-y-1">
                  {selectedCollaborators.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Aucun collaborateur sélectionné
                    </p>
                  ) : (
                    selectedCollaborators.map(collab => (
                      <div
                        key={collab.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 bg-white rounded hover:bg-gray-50 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{collab.fullName}</p>
                          <p className="text-xs text-gray-500">
                            {collab.totalUnits.toFixed(0)} unités
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveCollaborator(collab.id)}
                          className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition flex-shrink-0"
                          title="Retirer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isComputing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleCompute}
              disabled={isComputing || !selectedRank || selectedCollaborators.length === 0}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              <span>{isComputing ? 'Calcul en cours...' : 'Calculer le ranking'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




