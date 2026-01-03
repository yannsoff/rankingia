import { useState, useEffect } from 'react';
import { X, AlertCircle, Users, PlayCircle, Plus, Trash2, Minus } from 'lucide-react';
import { collaboratorAPI, indicatorAPI, rankingAPI } from '../../services/api';
import type { Collaborator, Dataset, Ranking, SpecialOperation } from '../../types';

interface MixedRanksModalProps {
  dataset: Dataset;
  onClose: () => void;
  onRankingComputed: (ranking: Ranking) => void;
}

export default function MixedRanksModal({
  dataset,
  onClose,
  onRankingComputed
}: MixedRanksModalProps) {
  const [availableRanks, setAvailableRanks] = useState<string[]>([]);
  const [selectedRanks, setSelectedRanks] = useState<string[]>([]);
  const [specialOperations, setSpecialOperations] = useState<SpecialOperation[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<Set<string>>(new Set());
  const [metricField, setMetricField] = useState('totalUnits');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState('');
  const [showCollaboratorSelection, setShowCollaboratorSelection] = useState(false);
  
  // Special operation form
  const [showAddOperation, setShowAddOperation] = useState(false);
  const [operationTargetId, setOperationTargetId] = useState('');
  const [operationSubtractIds, setOperationSubtractIds] = useState<Set<string>>(new Set());

  // Load available ranks on mount
  useEffect(() => {
    loadAvailableRanks();
  }, []);

  // Load collaborators when ranks are selected
  useEffect(() => {
    if (selectedRanks.length > 0) {
      loadCollaborators();
    }
  }, [selectedRanks]);

  const loadAvailableRanks = async () => {
    try {
      const response = await collaboratorAPI.getRanks(dataset.id);
      setAvailableRanks(response.data.ranks);
    } catch (err: any) {
      console.error('Error loading ranks:', err);
      setError('Erreur lors du chargement des rangs');
    }
  };

  const loadCollaborators = async () => {
    setIsLoading(true);
    try {
      // Load collaborators for all selected ranks
      const allCollaborators: Collaborator[] = [];
      for (const rank of selectedRanks) {
        const response = await collaboratorAPI.search(dataset.id, rank);
        allCollaborators.push(...response.data.collaborators);
      }
      
      console.log('📥 Collaborateurs chargés:', {
        ranks: selectedRanks,
        total: allCollaborators.length,
        byRank: selectedRanks.map(r => ({
          rank: r,
          count: allCollaborators.filter(c => c.rankCategory === r).length
        }))
      });
      
      setCollaborators(allCollaborators);
      
      // By default, select all collaborators from selected ranks
      setSelectedCollaborators(new Set(allCollaborators.map(c => c.id)));
    } catch (err: any) {
      console.error('Error loading collaborators:', err);
      setError('Erreur lors du chargement des collaborateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRankToggle = (rank: string) => {
    if (selectedRanks.includes(rank)) {
      // Remove rank
      const newRanks = selectedRanks.filter(r => r !== rank);
      setSelectedRanks(newRanks);
    } else {
      // Add rank (max 3)
      if (selectedRanks.length >= 3) {
        setError('Maximum 3 rangs peuvent être sélectionnés');
        return;
      }
      setSelectedRanks([...selectedRanks, rank]);
    }
    setError('');
  };

  const handleCollaboratorToggle = (collabId: string) => {
    const newSelected = new Set(selectedCollaborators);
    if (newSelected.has(collabId)) {
      newSelected.delete(collabId);
    } else {
      newSelected.add(collabId);
    }
    setSelectedCollaborators(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedCollaborators(new Set(collaborators.map(c => c.id)));
  };

  const handleDeselectAll = () => {
    setSelectedCollaborators(new Set());
  };

  const handleAddOperationClick = () => {
    console.log('➕ Ouverture formulaire opération:', {
      totalCollaborators: collaborators.length,
      selectedCollaborators: selectedCollaborators.size,
      byRank: ['CN', 'CD', 'FC', 'FA', 'AG'].map(rank => ({
        rank,
        inCollaborators: collaborators.filter(c => c.rankCategory === rank).length,
        inSelected: Array.from(selectedCollaborators).filter(id => {
          const collab = collaborators.find(c => c.id === id);
          return collab?.rankCategory === rank;
        }).length
      }))
    });
    
    setShowAddOperation(true);
    setOperationTargetId('');
    setOperationSubtractIds(new Set());
  };

  const handleCancelOperation = () => {
    setShowAddOperation(false);
    setOperationTargetId('');
    setOperationSubtractIds(new Set());
  };

  const handleSaveOperation = () => {
    if (!operationTargetId) {
      setError('Sélectionnez un collaborateur cible');
      return;
    }
    if (operationSubtractIds.size === 0) {
      setError('Sélectionnez au moins un collaborateur à soustraire');
      return;
    }

    // Check if target is already in an operation
    const existingOp = specialOperations.find(op => op.targetCollaboratorId === operationTargetId);
    if (existingOp) {
      setError('Ce collaborateur est déjà cible d\'une opération');
      return;
    }

    // Add the new operation
    const newOperation: SpecialOperation = {
      targetCollaboratorId: operationTargetId,
      subtractCollaboratorIds: Array.from(operationSubtractIds)
    };

    setSpecialOperations([...specialOperations, newOperation]);
    setShowAddOperation(false);
    setOperationTargetId('');
    setOperationSubtractIds(new Set());
    setError('');
  };

  const handleRemoveOperation = (targetId: string) => {
    setSpecialOperations(specialOperations.filter(op => op.targetCollaboratorId !== targetId));
  };

  const handleSubtractToggle = (collabId: string) => {
    const newSubtract = new Set(operationSubtractIds);
    if (newSubtract.has(collabId)) {
      newSubtract.delete(collabId);
    } else {
      newSubtract.add(collabId);
    }
    setOperationSubtractIds(newSubtract);
  };

  const handleCompute = async () => {
    if (!name.trim()) {
      setError('Le nom du ranking est requis');
      return;
    }
    
    if (selectedRanks.length === 0) {
      setError('Sélectionnez au moins un rang');
      return;
    }
    
    if (selectedCollaborators.size === 0) {
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
        rankingMode: 'mixedRanks' as const,
        groupBy: 'collaborator',
        metricField,
        aggregation: 'sum',
        sortOrder: 'desc',
        selectedRanks,
        specialOperations,
        includedCollaboratorIds: Array.from(selectedCollaborators),
      };

      console.log('📤 Envoi de l\'indicateur au backend:');
      console.log('  - Selected ranks:', selectedRanks);
      console.log('  - Special operations:', specialOperations);
      console.log('  - Included collaborators:', Array.from(selectedCollaborators).length);
      console.log('  - Metric field:', metricField);

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

  const getCollaboratorById = (id: string): Collaborator | undefined => {
    return collaborators.find(c => c.id === id);
  };

  // Get available collaborators for target selection (higher ranks like CN, CD)
  const getTargetCandidates = (): Collaborator[] => {
    // Prioritize CN and CD for targets
    const highRanks = ['CN', 'CD'];
    return collaborators.filter(c => 
      selectedCollaborators.has(c.id) && 
      c.rankCategory && 
      highRanks.includes(c.rankCategory)
    );
  };

  // Get available collaborators for subtraction (excluding the target)
  const getSubtractCandidates = (): Collaborator[] => {
    return collaborators.filter(c => 
      selectedCollaborators.has(c.id) && 
      c.id !== operationTargetId
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-gray-900">Ranking multi-rangs avec opérations</h3>
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
                placeholder="Ex: Classement FC+ (CN et CD ajustés)"
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
              Sélection des rangs (max 3) *
            </label>
            <div className="flex flex-wrap gap-2">
              {availableRanks.map(rank => (
                <button
                  key={rank}
                  onClick={() => handleRankToggle(rank)}
                  className={`px-4 py-2 rounded-lg border-2 transition ${
                    selectedRanks.includes(rank)
                      ? 'bg-primary-100 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {rank}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedRanks.length}/3 rangs sélectionnés
            </p>
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

          {/* Special Operations Section */}
          {selectedRanks.length > 0 && collaborators.length > 0 && (
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">
                  Opérations spéciales (soustractions par collaborateur)
                </h4>
                {!showAddOperation && (
                  <button
                    onClick={handleAddOperationClick}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une opération</span>
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Pour chaque opération, sélectionnez un collaborateur cible (généralement CN ou CD) 
                et les collaborateurs dont les valeurs seront soustraites.
              </p>

              {/* List of configured operations */}
              {specialOperations.length > 0 && (
                <div className="space-y-2 mb-4">
                  {specialOperations.map(op => {
                    const target = getCollaboratorById(op.targetCollaboratorId);
                    return (
                      <div key={op.targetCollaboratorId} className="bg-white border border-orange-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">
                                {target?.fullName || 'Collaborateur inconnu'}
                              </span>
                              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">
                                {target?.rankCategory}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Minus className="w-4 h-4 text-orange-600" />
                              <span>Soustraire :</span>
                              <div className="flex flex-wrap gap-1">
                                {op.subtractCollaboratorIds.map(subtractId => {
                                  const collab = getCollaboratorById(subtractId);
                                  return (
                                    <span key={subtractId} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                      {collab?.fullName} ({collab?.rankCategory})
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveOperation(op.targetCollaboratorId)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                            title="Supprimer cette opération"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add operation form */}
              {showAddOperation && (
                <div className="bg-white border-2 border-orange-300 rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      1. Sélectionner le collaborateur cible *
                    </label>
                    <select
                      value={operationTargetId}
                      onChange={(e) => setOperationTargetId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">-- Choisir un collaborateur --</option>
                      {getTargetCandidates().map(collab => (
                        <option key={collab.id} value={collab.id}>
                          {collab.fullName} ({collab.rankCategory}) - {collab.totalUnits.toFixed(0)} unités
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Généralement un CN ou CD
                    </p>
                  </div>

                  {operationTargetId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        2. Sélectionner les collaborateurs à soustraire *
                      </label>
                      <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg divide-y">
                        {getSubtractCandidates().map(collab => (
                          <label
                            key={collab.id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={operationSubtractIds.has(collab.id)}
                              onChange={() => handleSubtractToggle(collab.id)}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <div>
                                <span className="text-sm text-gray-900">{collab.fullName}</span>
                                <span className="text-xs text-gray-500 ml-2">({collab.rankCategory})</span>
                              </div>
                              <span className="text-xs text-gray-600">
                                {collab.totalUnits.toFixed(0)} unités
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {operationSubtractIds.size} collaborateur(s) sélectionné(s)
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCancelOperation}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveOperation}
                      disabled={!operationTargetId || operationSubtractIds.size === 0}
                      className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Valider l'opération
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collaborator Selection */}
          {selectedRanks.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  Sélection des collaborateurs
                </h4>
                <button
                  onClick={() => setShowCollaboratorSelection(!showCollaboratorSelection)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {showCollaboratorSelection ? 'Masquer' : 'Afficher'} ({selectedCollaborators.size}/{collaborators.length})
                </button>
              </div>

              {showCollaboratorSelection && (
                <>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                    >
                      Tout sélectionner
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                    >
                      Tout désélectionner
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Chargement...</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {collaborators.map(collab => (
                        <label
                          key={collab.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCollaborators.has(collab.id)}
                            onChange={() => handleCollaboratorToggle(collab.id)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm text-gray-900">{collab.fullName}</span>
                            <span className="text-xs text-gray-500 ml-2">({collab.rankCategory})</span>
                          </div>
                          <span className="text-xs text-gray-600">
                            {collab.totalUnits.toFixed(0)} unités
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
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
              disabled={isComputing || selectedRanks.length === 0 || selectedCollaborators.size === 0}
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




