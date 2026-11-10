import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import {
  FileJson, ImagePlus, Loader2, MapPin, Minus, Plus, Save, Trophy, UploadCloud, UserPlus, Wrench, X,
} from 'lucide-react';
import {
  Avatar, Badge, Button, Card, Input, Label, PageHeader, Select, useConfirm,
} from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { addBattle } from '../firebase/battles';
import { processBattleResults } from '../firebase/players';
import { recognizeImage } from '../utils/ocrService';
import { migratePlayerName } from '../firebase/migration';
import pendingBattlesData from '../data/pending_battles.json';
import { MAPS, OPERATORS } from '../constants';
import { useRogueData } from '../data';

const STAT_FIELDS = [
  { key: 'elims', label: 'Elims', short: 'K' },
  { key: 'downs', label: 'Downs', short: 'D' },
  { key: 'assists', label: 'Assists', short: 'A' },
  { key: 'revives', label: 'Revives', short: 'R' },
  { key: 'damage', label: 'Damage', short: 'DMG' },
  { key: 'captures', label: 'Captures', short: 'CP' },
];

const newId = () => `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

const getBattleSignature = (battle) => {
  const t1 = battle.team1 && battle.team1[0] ? battle.team1[0].name : '';
  const t1Damage = battle.team1 && battle.team1[0] ? battle.team1[0].damage : '';
  const score = `${battle.team1Rounds}-${battle.team2Rounds}`;
  const map = battle.map || 'Unknown';
  return `SIG_${map}_${t1}_${t1Damage}_${score}`;
};

export default function AddBattle() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { battles, players: allPlayers } = useRogueData();

  const [formData, setFormData] = useState({ map: '', team1: [], team2: [], team1Rounds: 0, team2Rounds: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportMode, setShowImportMode] = useState(false);
  const [pendingBattles, setPendingBattles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const onClose = useCallback(() => navigate('/rogue/jogos'), [navigate]);

  // Operador mais usado por jogador (lastOperator conta como peso inicial)
  const playerFavoriteOperators = useMemo(() => {
    const operatorCount = {};
    allPlayers.forEach(player => {
      if (player.lastOperator && player.lastOperator !== 'Unknown' && player.lastOperator.trim() !== '') {
        operatorCount[player.name] = { [player.lastOperator]: 1 };
      }
    });
    battles.forEach(battle => {
      [...(battle.team1 || []), ...(battle.team2 || [])].forEach(player => {
        if (!player || !player.name) return;
        if (player.operator && player.operator !== 'Unknown' && player.operator.trim() !== '') {
          if (!operatorCount[player.name]) operatorCount[player.name] = {};
          operatorCount[player.name][player.operator] = (operatorCount[player.name][player.operator] || 0) + 1;
        }
      });
    });
    const favorites = {};
    Object.keys(operatorCount).forEach(name => {
      const ops = operatorCount[name];
      const keys = Object.keys(ops);
      if (keys.length) favorites[name] = keys.reduce((a, b) => (ops[a] > ops[b] ? a : b));
    });
    return favorites;
  }, [allPlayers, battles]);

  // ------------------------------------------------------------------ form

  const addPlayerToTeam = (team, playerName) => {
    if (!playerName.trim()) return;
    const isInTeam1 = formData.team1.some(p => p.name === playerName.trim());
    const isInTeam2 = formData.team2.some(p => p.name === playerName.trim());
    if (isInTeam1 || isInTeam2) {
      toast.error('Este jogador já está numa equipa!');
      return;
    }
    if (formData[team].length >= 4) {
      toast.error('Esta equipa já tem 4 jogadores!');
      return;
    }
    const name = playerName.trim();
    const newPlayer = {
      id: newId(),
      name,
      operator: playerFavoriteOperators[name] || '',
      elims: 0, downs: 0, assists: 0, revives: 0, damage: 0, captures: 0
    };
    setFormData(prev => ({ ...prev, [team]: [...prev[team], newPlayer] }));
  };

  const removePlayerFromTeam = (team, playerId) => {
    setFormData(prev => ({ ...prev, [team]: prev[team].filter(p => p.id !== playerId) }));
  };

  const updatePlayer = (team, playerId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [team]: prev[team].map(p => (p.id === playerId ? { ...p, [field]: value } : p))
    }));
  };

  const updateRounds = (team, value) => {
    const newValue = Math.max(0, Math.min(3, parseInt(value) || 0));
    setFormData(prev => ({ ...prev, [team]: newValue }));
  };

  const getWinner = () => {
    if (formData.team1Rounds >= 3) return 'team1';
    if (formData.team2Rounds >= 3) return 'team2';
    return null;
  };

  // ------------------------------------------------------------------ batch

  const loadBattleIntoForm = useCallback((battleData) => {
    const enrichTeam = (team) => team.map(player => ({
      ...player,
      id: player.id || newId(),
      operator: player.operator && player.operator !== 'Unknown'
        ? player.operator
        : (playerFavoriteOperators[player.name] || '')
    }));
    setFormData({
      map: battleData.map,
      team1: enrichTeam(battleData.team1),
      team2: enrichTeam(battleData.team2),
      team1Rounds: battleData.team1Rounds || 0,
      team2Rounds: battleData.team2Rounds || 0
    });
  }, [playerFavoriteOperators]);

  const handleNextBattle = () => {
    const remaining = pendingBattles.slice(1);
    setPendingBattles(remaining);
    if (remaining.length > 0) {
      loadBattleIntoForm(remaining[0]);
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isBatch = pendingBattles.length > 0;

    if (!formData.map) {
      toast.error('Seleciona um mapa!');
      return;
    }
    if (formData.team1.length !== 4 || formData.team2.length !== 4) {
      toast.error('Cada equipa deve ter exatamente 4 jogadores!');
      return;
    }

    setIsSubmitting(true);
    try {
      const winner = getWinner();
      const battleData = {
        map: formData.map,
        mode: 'Strikeout',
        result: winner === 'team1' ? 'win' : 'loss',
        team1: formData.team1,
        team2: formData.team2,
        team1Rounds: formData.team1Rounds,
        team2Rounds: formData.team2Rounds,
        date: new Date().toISOString().split('T')[0]
      };

      await addBattle(battleData);
      await processBattleResults(battleData);
      toast.success('Batalha guardada!', { description: `${battleData.map} · ${battleData.team1Rounds}–${battleData.team2Rounds}` });

      if (isBatch) {
        const currentBattle = pendingBattles[0];
        if (currentBattle._signature) {
          const processed = JSON.parse(localStorage.getItem('rogue_processed_battles') || '[]');
          if (!processed.includes(currentBattle._signature)) {
            processed.push(currentBattle._signature);
            localStorage.setItem('rogue_processed_battles', JSON.stringify(processed));
          }
        }
        handleNextBattle();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao adicionar batalha:', error);
      toast.error('Erro ao adicionar batalha. Tenta novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const processFiles = useCallback(async (files) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    const results = [];
    try {
      const knownNames = allPlayers.map(p => p.name);
      for (const file of files) {
        const data = await recognizeImage(file, knownNames);
        results.push({ ...data, originalFile: file.name });
      }
      if (results.length > 0) {
        setPendingBattles(prev => [...prev, ...results]);
        if (pendingBattles.length === 0) {
          loadBattleIntoForm(results[0]);
          setShowImportMode(false);
        }
        toast.success(`${results.length} imagem(ns) processada(s)`);
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      toast.error('Erro ao processar as imagens.', { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  }, [pendingBattles, loadBattleIntoForm, allPlayers]);

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length > 0) await processFiles(imageFiles);
      else toast.error('Por favor, arrasta apenas ficheiros de imagem.');
    }
  };

  // Colar imagens (Ctrl+V) em modo importação
  useEffect(() => {
    const handlePaste = async (e) => {
      if (!showImportMode) return;
      const imageFiles = [];
      for (const item of e.clipboardData.items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) await processFiles(imageFiles);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showImportMode, processFiles]);

  const handleLoadPendingJson = () => {
    if (!pendingBattlesData || pendingBattlesData.length === 0) {
      toast.error('O ficheiro JSON no código está vazio ([]).');
      return;
    }
    const processedSignatures = JSON.parse(localStorage.getItem('rogue_processed_battles') || '[]');
    const results = [];
    let skipped = 0;
    pendingBattlesData.forEach((battle, index) => {
      const sig = getBattleSignature(battle);
      if (processedSignatures.includes(sig)) {
        skipped++;
        return;
      }
      results.push({ ...battle, _signature: sig, originalFile: battle.originalFile || `JSONItem_${index + 1}` });
    });

    if (results.length === 0) {
      toast.info(skipped > 0
        ? `Todas as ${skipped} batalhas do ficheiro já foram processadas anteriormente!`
        : 'O ficheiro JSON no código está vazio ([]).');
      return;
    }

    setPendingBattles(prev => [...prev, ...results]);
    if (pendingBattles.length === 0) {
      loadBattleIntoForm(results[0]);
      setShowImportMode(false);
    }
    toast.success(`${results.length} novas batalhas carregadas`, { description: `${skipped} ignoradas por já terem sido feitas` });
  };

  const handleFixNames = async () => {
    const ok = await confirm({
      title: 'Corrigir nomes',
      description: "Renomear 'wrrqvy' para 'DiogoFrancxssco' em TODA a base de dados?",
      confirmText: 'Renomear',
      danger: true,
    });
    if (!ok) return;
    const id = toast.loading('A processar… (detalhes na consola)');
    const res = await migratePlayerName('wrrqvy', 'DiogoFrancxssco');
    toast.success(String(res), { id });
  };

  // ------------------------------------------------------------------ render

  const inBatch = pendingBattles.length > 0;
  const winner = getWinner();
  const takenNames = new Set([...formData.team1, ...formData.team2].map(p => p.name));
  const suggestions = allPlayers.map(p => p.name).filter(n => !takenNames.has(n)).sort((a, b) => a.localeCompare(b));

  return (
    <>
      <PageHeader
        backTo="/rogue"
        backLabel="Rogue Tracker"
        eyebrow={inBatch ? 'Modo de validação' : 'Nova partida'}
        title={inBatch ? `Validar batalhas` : 'Adicionar Batalha'}
        description={inBatch
          ? `${pendingBattles.length} batalha${pendingBattles.length > 1 ? 's' : ''} na fila. Revê os dados e guarda uma de cada vez.`
          : 'Strikeout 4v4. Preenche à mão, importa screenshots ou carrega o JSON pendente.'}
        actions={!inBatch && (
          <>
            <Button variant="outline" onClick={handleLoadPendingJson}>
              <FileJson className="size-4" /> Carregar JSON
            </Button>
            <Button variant={showImportMode ? 'secondary' : 'outline'} onClick={() => setShowImportMode(!showImportMode)}>
              {showImportMode ? <><X className="size-4" /> Voltar ao manual</> : <><ImagePlus className="size-4" /> Importar imagens</>}
            </Button>
          </>
        )}
      />

      <AnimatePresence mode="wait">
        {showImportMode ? (
          <motion.div key="import" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <label
              htmlFor="batch-upload-input"
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'flex min-h-80 cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-10 text-center transition-all',
                dragging ? 'scale-[1.01] border-accent bg-accent/10' : 'border-line-strong bg-surface/50 hover:border-accent/50 hover:bg-surface',
                isProcessing && 'pointer-events-none',
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-12 animate-spin text-accent" />
                  <div>
                    <p className="font-display text-lg font-semibold">A processar imagens…</p>
                    <p className="text-sm text-muted">O OCR pode demorar alguns segundos por imagem.</p>
                  </div>
                </>
              ) : (
                <>
                  <motion.div animate={{ y: dragging ? -6 : 0 }} className="grid size-16 place-items-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/25">
                    <UploadCloud className="size-8" />
                  </motion.div>
                  <div>
                    <p className="font-display text-lg font-semibold">Importar screenshots (batch)</p>
                    <p className="mt-1 text-sm text-muted">
                      Clica, arrasta ou cola (<kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">Ctrl</kbd>+<kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">V</kbd>) várias imagens.
                    </p>
                  </div>
                </>
              )}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => processFiles(Array.from(e.target.files))}
                className="hidden"
                id="batch-upload-input"
              />
            </label>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Map + batch info */}
            <Card className="flex flex-col gap-4 p-5 md:flex-row md:items-end">
              <div className="md:w-72">
                <Label htmlFor="map"><MapPin className="mr-1 inline size-3" />Mapa</Label>
                <Select id="map" value={formData.map} onChange={(e) => setFormData(prev => ({ ...prev, map: e.target.value }))}>
                  <option value="">Seleciona um mapa</option>
                  {MAPS.map(map => <option key={map} value={map}>{map}</option>)}
                </Select>
              </div>
              {inBatch && (
                <div className="flex flex-wrap items-center gap-2 md:ml-auto">
                  <Badge tone="accent">Fila: {pendingBattles.length}</Badge>
                  {pendingBattles[0].originalFile && <Badge>{pendingBattles[0].originalFile}</Badge>}
                </div>
              )}
            </Card>

            {/* Teams */}
            <div className="grid gap-6 2xl:grid-cols-2">
              {['team1', 'team2'].map((team, ti) => {
                const roundsKey = `${team}Rounds`;
                const rounds = formData[roundsKey];
                const isWinner = winner === team;
                return (
                  <Card key={team} className={cn('overflow-hidden transition-colors', isWinner && 'border-win/40')}>
                    <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4', isWinner ? 'bg-win/10' : 'bg-white/[0.02]')}>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-lg font-bold">Team {ti + 1}</span>
                        <span className="text-xs text-muted tabular">{formData[team].length}/4</span>
                        <AnimatePresence>
                          {isWinner && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <Badge tone="win"><Trophy className="size-3" /> Vitória</Badge>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium tracking-wide text-muted uppercase">Rondas</span>
                        <div className="flex items-center rounded-xl border border-line-strong bg-surface-2">
                          <button type="button" aria-label="Menos" onClick={() => updateRounds(roundsKey, rounds - 1)} className="grid size-9 cursor-pointer place-items-center text-muted hover:text-fg">
                            <Minus className="size-4" />
                          </button>
                          <div className="flex gap-1 px-1">
                            {[1, 2, 3].map(n => (
                              <button
                                type="button"
                                key={n}
                                onClick={() => updateRounds(roundsKey, rounds === n ? n - 1 : n)}
                                className={cn('h-5 w-3 cursor-pointer rounded-sm transition-colors', n <= rounds ? (isWinner ? 'bg-win' : 'bg-accent') : 'bg-white/10 hover:bg-white/20')}
                                aria-label={`${n} rondas`}
                              />
                            ))}
                          </div>
                          <button type="button" aria-label="Mais" onClick={() => updateRounds(roundsKey, rounds + 1)} className="grid size-9 cursor-pointer place-items-center text-muted hover:text-fg">
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <span className="w-6 text-center font-display text-xl font-bold tabular">{rounds}</span>
                      </div>
                    </div>

                    {/* Column header (desktop) */}
                    <div className="hidden grid-cols-[minmax(10rem,1.4fr)_minmax(8rem,1fr)_repeat(6,minmax(3.5rem,0.6fr))] gap-2 border-b border-line px-5 py-2 text-[11px] font-semibold tracking-wider text-muted uppercase lg:grid">
                      <span>Jogador</span>
                      <span>Operador</span>
                      {STAT_FIELDS.map(f => <span key={f.key} className="text-center">{f.label}</span>)}
                    </div>

                    <div className="divide-y divide-line">
                      <AnimatePresence initial={false}>
                        {formData[team].map(player => (
                          <motion.div
                            key={player.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-6 gap-2 px-5 py-3 lg:grid-cols-[minmax(10rem,1.4fr)_minmax(8rem,1fr)_repeat(6,minmax(3.5rem,0.6fr))] lg:items-center">
                              <div className="col-span-6 flex min-w-0 items-center gap-2.5 lg:col-span-1">
                                <Avatar name={player.name} size="sm" />
                                <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
                                <Button type="button" variant="ghost" size="icon-sm" title="Remover" onClick={() => removePlayerFromTeam(team, player.id)}>
                                  <X className="size-3.5" />
                                </Button>
                              </div>
                              <Select
                                value={player.operator || ''}
                                onChange={(e) => updatePlayer(team, player.id, 'operator', e.target.value)}
                                className="h-9 text-[13px]"
                                wrapperClassName="col-span-6 lg:col-span-1"
                              >
                                <option value="">Operador…</option>
                                {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                              </Select>
                              {STAT_FIELDS.map(f => (
                                <label key={f.key} className="col-span-2 sm:col-span-1 lg:col-span-1">
                                  <span className="mb-1 block text-center text-[10px] font-semibold tracking-wider text-subtle uppercase lg:hidden">{f.short}</span>
                                  <Input
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    value={player[f.key] || 0}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => updatePlayer(team, player.id, f.key, parseInt(e.target.value) || 0)}
                                    className="h-9 px-1 text-center tabular"
                                  />
                                </label>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {formData[team].length < 4 && (
                        <div className="flex items-center gap-2.5 px-5 py-3">
                          <div className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-line-strong text-subtle">
                            <UserPlus className="size-4" />
                          </div>
                          <Input
                            list="rogue-known-players"
                            placeholder="Nome do jogador… (Enter para adicionar)"
                            className="h-9 max-w-xs border-transparent bg-transparent hover:border-line-strong"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addPlayerToTeam(team, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                addPlayerToTeam(team, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
            <datalist id="rogue-known-players">
              {suggestions.map(n => <option key={n} value={n} />)}
            </datalist>

            {/* Actions */}
            <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-line-strong bg-surface/90 p-3 shadow-2xl backdrop-blur-xl">
              <Button type="button" variant="ghost" size="sm" onClick={handleFixNames} title="Ferramenta temporária de migração">
                <Wrench className="size-3.5" /> <span className="hidden sm:inline">Fix names</span>
              </Button>
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                {inBatch && pendingBattles.length > 1 && (
                  <Button type="button" variant="outline" onClick={handleNextBattle} disabled={isSubmitting}>Saltar</Button>
                )}
                <Button type="submit" variant="primary" loading={isSubmitting}>
                  {!isSubmitting && <Save className="size-4" />}
                  {isSubmitting ? 'A guardar…' : (pendingBattles.length > 1 ? 'Guardar & próximo' : 'Guardar batalha')}
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </>
  );
}
