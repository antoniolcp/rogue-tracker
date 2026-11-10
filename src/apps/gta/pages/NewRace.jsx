import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Camera, FileJson, Inbox, Loader2, Save, Trash2, Upload } from 'lucide-react';
import { Avatar, Button, Card, Input, Label, PageHeader, useConfirm } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { gtaService } from '../services/gtaService';
import pendingRaces from '../data/pending_races.json';
import { useGtaData } from '../data';
import { TEAM_COLORS } from '../utils/stats';

const sumRaces = (races) => races.reduce((a, b) => Number(a) + Number(b), 0);

export default function NewRace() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { players: availablePlayers } = useGtaData();

  // Linhas = jogadores, colunas = corridas
  const [gridData, setGridData] = useState([]);
  const [numRaces, setNumRaces] = useState(3);
  const [championshipName, setChampionshipName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const matchPlayer = (name) =>
    availablePlayers.find(p => p.name && p.name.toLowerCase().includes(name.toLowerCase())) || { id: null, name };

  // Simulação de OCR (placeholder com dados de exemplo de um screenshot)
  const simulateOCR = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const mockResults = [
        { name: 'zManin-xZ', races: [15, 16, 13] },
        { name: 'xClassicMurder', races: [16, 15, 12] },
        { name: 'xCartierIV_', races: [12, 13, 16] },
        { name: 'EatMyOneShoot_', races: [13, 12, 15] },
        { name: 'Ambitionz--17', races: [12, 12, 15] }
      ];
      setNumRaces(3);
      setGridData(mockResults.map(r => {
        const player = matchPlayer(r.name);
        return { playerId: player.id, playerName: player.name, races: r.races, total: sumRaces(r.races) };
      }));
      setIsProcessing(false);
      toast.info('OCR simulado: dados de exemplo carregados.');
    }, 1500);
  };

  const processJSONData = (data) => {
    if (!data || data.length === 0) {
      toast.error('Nenhum dado encontrado no JSON');
      setIsProcessing(false);
      return;
    }
    const detectedRaces = data[0].races ? data[0].races.length : 0;
    if (detectedRaces === 0) {
      toast.error('Dados sem corridas detectadas.');
      setIsProcessing(false);
      return;
    }
    setNumRaces(detectedRaces);
    setGridData(data.map(r => {
      const player = matchPlayer(r.playerName);
      return {
        playerId: player.id,
        playerName: player.name || r.playerName,
        races: [...r.races],
        color: r.color || '#a855f7',
        total: sumRaces(r.races)
      };
    }));
    setIsProcessing(false);
    toast.success(`${data.length} pilotos · ${detectedRaces} corridas carregadas`);
  };

  const loadFromJSON = () => {
    setIsProcessing(true);
    if (!pendingRaces || pendingRaces.length === 0) {
      toast.error('Nenhum dado encontrado em pending_races.json');
      setIsProcessing(false);
      return;
    }
    processJSONData(pendingRaces);
  };

  const handleJSONFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        processJSONData(JSON.parse(event.target.result));
      } catch (err) {
        console.error('JSON Parse Error:', err);
        toast.error('Erro ao processar ficheiro JSON', { description: err.message });
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const updateRow = (idx, patch) => {
    setGridData(rows => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const updatePoints = (idx, rIdx, value) => {
    setGridData(rows => rows.map((r, i) => {
      if (i !== idx) return r;
      const races = r.races.map((p, k) => (k === rIdx ? (parseInt(value) || 0) : p));
      return { ...r, races, total: sumRaces(races) };
    }));
  };

  const handleClearData = async () => {
    const ok = await confirm({ title: 'Limpar dados?', description: 'Tens a certeza que queres limpar todos os dados?', confirmText: 'Limpar', danger: true });
    if (ok) {
      setGridData([]);
      setChampionshipName('');
      setNumRaces(3);
    }
  };

  const handleSaveEvent = async () => {
    if (gridData.length === 0) return;
    setIsSaving(true);
    const toastId = toast.loading('A guardar campeonato…');

    try {
      // 1. Garantir que todos os jogadores existem
      const updatedGridData = [];
      for (const row of gridData) {
        let pid = row.playerId;
        if (!pid) {
          try {
            const newDoc = await gtaService.createPlayer(row.playerName);
            pid = newDoc.id;
          } catch (e) {
            throw new Error(`Erro ao criar jogador ${row.playerName}: ${e.message}`);
          }
        }
        updatedGridData.push({ ...row, playerId: pid });
      }

      // 2. Playlist
      const dateStr = new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const playlistName = championshipName.trim() || `Campeonato ${dateStr}`;
      const playlistDoc = await gtaService.createPlaylist(playlistName);
      const playlistId = playlistDoc.id;

      // 3. Corridas
      for (let i = 0; i < numRaces; i++) {
        const raceResults = updatedGridData
          .map(row => ({ playerId: row.playerId, playerName: row.playerName, points: Number(row.races[i]) || 0, teamColor: row.color }))
          .sort((a, b) => Number(b.points) - Number(a.points))
          .map((r, idx) => ({ ...r, position: idx + 1 }));
        await gtaService.addRace(playlistId, `Corrida ${i + 1}`, raceResults);
      }

      // 4. Resumo
      let maxPoints = -1;
      let winnerName = 'N/A';
      updatedGridData.forEach(row => {
        const total = sumRaces(row.races);
        if (total > maxPoints) {
          maxPoints = total;
          winnerName = row.playerName;
        }
      });
      await gtaService.updatePlaylist(playlistId, { raceCount: numRaces, winner: winnerName });

      toast.success('Campeonato guardado com sucesso!', { id: toastId, description: `Vencedor: ${winnerName}` });
      navigate(`/gta/campeonatos/${playlistId}`);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Erro ao guardar evento', { id: toastId, description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const ranked = [...gridData].map((r, i) => ({ ...r, _i: i })).sort((a, b) => b.total - a.total);
  const position = new Map(ranked.map((r, pos) => [r._i, pos + 1]));

  return (
    <>
      <PageHeader
        backTo="/gta"
        backLabel="GTA"
        eyebrow="Novo campeonato"
        title="Nova Corrida"
        description="Importa os resultados e revê os pontos antes de guardar. O total é calculado automaticamente."
      />

      <AnimatePresence mode="wait">
        {!gridData.length ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-4 md:grid-cols-3">
            <ImportCard
              icon={Camera}
              title="Carregar foto"
              desc="OCR de screenshot (simulado com dados de exemplo)."
              loading={isProcessing}
              input={<input type="file" onChange={(e) => e.target.files[0] && simulateOCR()} hidden accept="image/*" />}
            />
            <ImportCard
              icon={Upload}
              title="Ficheiro JSON"
              desc="Carrega um .json com { playerName, races[], color? }."
              loading={isProcessing}
              input={<input type="file" onChange={handleJSONFileUpload} hidden accept=".json" />}
            />
            <ImportCard
              icon={Inbox}
              title="Dados pendentes"
              desc={`pending_races.json · ${pendingRaces?.length || 0} pilotos`}
              loading={isProcessing}
              onClick={loadFromJSON}
              highlight
            />
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="champ">Nome do campeonato</Label>
                <Input id="champ" value={championshipName} onChange={(e) => setChampionshipName(e.target.value)} placeholder="Ex: Jamais, Temporada 2025…" />
              </div>
              <div className="flex items-center gap-3 text-sm text-muted">
                <FileJson className="size-4" /> {gridData.length} pilotos · {numRaces} corridas
              </div>
            </Card>

            <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-line bg-surface/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2/60 text-[11px] tracking-wider text-muted uppercase">
                    <th className="px-3 py-2.5 text-left font-semibold">#</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Piloto</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Equipa</th>
                    {Array.from({ length: numRaces }).map((_, i) => <th key={i} className="px-1 py-2.5 text-center font-semibold">C{i + 1}</th>)}
                    <th className="px-3 py-2.5 text-right font-semibold text-accent">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {gridData.map((row, idx) => (
                    <tr key={idx} className="border-b border-line last:border-0" style={row.color ? { boxShadow: `inset 3px 0 0 ${row.color === '#000000' ? '#9ca3af' : row.color}` } : undefined}>
                      <td className="px-3 py-2.5 text-xs text-muted tabular">{position.get(idx)}º</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5 whitespace-nowrap">
                          <Avatar name={row.playerName} size="sm" />
                          <span className="font-medium">{row.playerName}</span>
                          {!row.playerId && <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent uppercase">novo</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex w-[7.5rem] flex-wrap gap-1">
                          {TEAM_COLORS.map(c => (
                            <button
                              key={c.value}
                              type="button"
                              title={c.label}
                              onClick={() => updateRow(idx, { color: c.value })}
                              className={cn(
                                'size-[18px] cursor-pointer rounded-full ring-1 ring-white/20 transition-transform hover:scale-110',
                                (row.color || '#a855f7') === c.value && 'ring-2 ring-fg ring-offset-2 ring-offset-surface',
                              )}
                              style={{ background: c.value }}
                            />
                          ))}
                        </div>
                      </td>
                      {row.races.map((points, rIdx) => (
                        <td key={rIdx} className="px-1 py-2.5 text-center">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            value={points}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => updatePoints(idx, rIdx, e.target.value)}
                            className="mx-auto h-9 w-14 px-1 text-center tabular"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right font-display text-lg font-bold text-accent tabular">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-line-strong bg-surface/90 p-3 shadow-2xl backdrop-blur-xl">
              <Button variant="ghost" onClick={handleClearData} disabled={isSaving}><Trash2 className="size-4" /> Limpar</Button>
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" onClick={() => navigate('/gta')} disabled={isSaving}>Cancelar</Button>
                <Button variant="primary" onClick={handleSaveEvent} loading={isSaving}>
                  {!isSaving && <Save className="size-4" />}
                  {isSaving ? 'A guardar…' : `Confirmar e guardar (${numRaces} corridas)`}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ImportCard({ icon: Icon, title, desc, input, onClick, loading, highlight }) {
  const Comp = input ? 'label' : 'button';
  return (
    <Comp
      type={input ? undefined : 'button'}
      onClick={onClick}
      className={cn(
        'group flex cursor-pointer flex-col items-start gap-4 rounded-2xl border p-6 text-left transition-all hover:-translate-y-1',
        highlight ? 'border-accent/40 bg-gradient-to-br from-accent/10 to-transparent hover:border-accent' : 'border-line bg-surface/70 hover:border-line-strong hover:bg-surface-2',
        loading && 'pointer-events-none opacity-60',
      )}
    >
      <div className="grid size-12 place-items-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20 transition-transform group-hover:scale-110">
        {loading ? <Loader2 className="size-6 animate-spin" /> : <Icon className="size-6" />}
      </div>
      <div>
        <div className="font-display text-lg font-semibold">{title}</div>
        <div className="mt-1 text-sm text-muted">{desc}</div>
      </div>
      {input}
    </Comp>
  );
}
