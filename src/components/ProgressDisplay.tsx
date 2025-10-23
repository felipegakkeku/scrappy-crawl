import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ProgressDisplayProps {
  status: string;
  isLoading: boolean;
  visited: number;
  queue: number;
  written: number;
  processed: number;
  externalSkips: number;
  progressPercent: number;
  eta: string;
  showWarmup: boolean;
  warmupProgress: number;
  warmupMessage: string;
  warmupCountdown: number;
}

export const ProgressDisplay = ({
  status,
  isLoading,
  visited,
  queue,
  written,
  processed,
  externalSkips,
  progressPercent,
  eta,
  showWarmup,
  warmupProgress,
  warmupMessage,
  warmupCountdown,
}: ProgressDisplayProps) => {
  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center justify-center gap-3 p-4 border rounded-lg bg-muted/50">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        <span className="font-semibold" dangerouslySetInnerHTML={{ __html: status }} />
      </div>

      {/* Warmup Notice */}
      {showWarmup && (
        <div className="border border-info-border bg-info-bg rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-xl">🧰</span>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">Preparando o primeiro ciclo (≈70s)</p>
              <p className="text-xs text-muted-foreground">{warmupMessage}</p>
            </div>
          </div>
          <Progress value={warmupProgress} className="h-1.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Etapa inicial</span>
            <span className="text-tabular">{warmupCountdown}s restantes</span>
          </div>
        </div>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{visited}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Visitadas</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-primary">{queue}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Na Fila</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-primary">{written}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Salvas</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{externalSkips}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Externos</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-primary">{processed}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Processadas</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progressPercent}%</span>
          <span className="text-tabular">{eta}</span>
        </div>
      </div>
    </div>
  );
};
