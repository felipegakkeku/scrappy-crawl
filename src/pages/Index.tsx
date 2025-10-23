import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CrawlerForm, type CrawlConfig } from "@/components/CrawlerForm";
import { ProgressDisplay } from "@/components/ProgressDisplay";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Play, Square, BarChart3, Download } from "lucide-react";

const WARMUP_SECONDS = 70;
const WARMUP_STEPS = [
  { t: 0, msg: 'ajustando trigger…' },
  { t: 10, msg: 'checando permissões…' },
  { t: 20, msg: 'criando fila inicial…' },
  { t: 35, msg: 'buscando sitemaps…' },
  { t: 50, msg: 'preparando workers…' },
  { t: 60, msg: 'iniciando primeira coleta…' },
];

const Index = () => {
  const [config, setConfig] = useState<CrawlConfig | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [status, setStatus] = useState('Pronto para iniciar.');
  const [isLoading, setIsLoading] = useState(false);
  
  // KPI states
  const [visited, setVisited] = useState(0);
  const [queue, setQueue] = useState(0);
  const [written, setWritten] = useState(0);
  const [externalSkips, setExternalSkips] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [eta, setEta] = useState('ETA —');

  // Warmup states
  const [showWarmup, setShowWarmup] = useState(false);
  const [warmupProgress, setWarmupProgress] = useState(0);
  const [warmupMessage, setWarmupMessage] = useState('');
  const [warmupCountdown, setWarmupCountdown] = useState(WARMUP_SECONDS);
  
  const warmupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warmupEndsAtRef = useRef(0);

  const processed = visited + written;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMessage = (ev: MessageEvent) => {
      const { type, payload } = ev.data || {};

      if (type === 'startCrawl:ok') {
        console.log('Crawl iniciado:', payload);
      }

      if (type === 'startCrawl:err') {
        console.error('Erro ao iniciar:', payload);
        setIsRunning(false);
        setIsLoading(false);
        setStatus('Erro ao iniciar.');
        stopWarmup();
        toast.error('Erro ao iniciar rastreamento.');
      }

      if (type === 'getUiStatus:ok') {
        const { isRunning: running, status: crawlStatus } = payload || {};

        if (crawlStatus) {
          setVisited(crawlStatus.visited || 0);
          setQueue(crawlStatus.queueLen || 0);
          setWritten(crawlStatus.written || 0);
          setExternalSkips(crawlStatus.externalSkips || 0);

          if (crawlStatus.eta) {
            setEta(`ETA ${crawlStatus.eta}`);
          }
        }

        if (!running && isRunning) {
          handleStop();
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      pollingIntervalRef.current = setInterval(() => {
        window.parent.postMessage({ type: 'getUiStatus' }, "*");
      }, 2000);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    const total = Math.max(visited + queue, 1);
    const pct = Math.min(100, Math.round((visited / total) * 100));
    setProgressPercent(pct);
  }, [visited, queue]);

  const startWarmup = () => {
    warmupEndsAtRef.current = Date.now() + WARMUP_SECONDS * 1000;
    setShowWarmup(true);
    setWarmupProgress(2);
    setWarmupMessage(WARMUP_STEPS[0].msg);
    setWarmupCountdown(WARMUP_SECONDS);

    if (warmupIntervalRef.current) clearInterval(warmupIntervalRef.current);

    warmupIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, warmupEndsAtRef.current - now);
      const remaining = Math.ceil(remainingMs / 1000);
      const elapsed = Math.min(WARMUP_SECONDS, Math.max(0, Math.round((WARMUP_SECONDS * 1000 - remainingMs) / 1000)));

      let msg = WARMUP_STEPS[0].msg;
      for (const step of WARMUP_STEPS) {
        if (elapsed >= step.t) msg = step.msg;
        else break;
      }

      setWarmupMessage(msg);
      setWarmupCountdown(remaining);
      const pct = Math.max(2, Math.min(100, Math.round((elapsed / WARMUP_SECONDS) * 100)));
      setWarmupProgress(pct);

      if (remaining <= 0) {
        stopWarmup();
      }
    }, 1000);
  };

  const stopWarmup = () => {
    if (warmupIntervalRef.current) {
      clearInterval(warmupIntervalRef.current);
      warmupIntervalRef.current = null;
    }
    setShowWarmup(false);
  };

  const handleStart = () => {
    if (!config || !config.url) {
      toast.error('Informe a URL principal.');
      return;
    }

    setIsRunning(true);
    setIsLoading(true);
    setStatus('Iniciando');
    startWarmup();

    window.parent.postMessage({
      type: 'startCrawl',
      payload: {
        url: config.url,
        maxDepth: config.maxDepth,
        maxExternalDistinct: config.maxExternalDistinct,
        excludeDomains: config.excludeDomains,
        useOAuth2: config.useOAuth2
      }
    }, "*");

    toast.success('Rastreamento iniciado!');
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsLoading(false);
    setStatus('Parado pelo usuário.');
    stopWarmup();

    window.parent.postMessage({
      type: 'stopCrawl'
    }, "*");

    toast.info('Rastreamento parado.');
  };

  const handleDashboard = () => {
    toast.info('Gerando dashboard...');
    // In real app, this would call backend
    setTimeout(() => {
      toast.success('Dashboard atualizado!');
    }, 1500);
  };

  const handleExport = () => {
    toast.info('Exportando resultados...');
    // In real app, this would call backend
    setTimeout(() => {
      toast.success('Exportação concluída!');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8 px-4">
        {/* Header */}
        <header className="relative text-center mb-8">
          <ThemeToggle />
          <h1 className="text-3xl font-bold mb-1">
            <span className="gradient-primary bg-clip-text text-transparent">Scrappo</span>
            {' '}
            <span className="text-foreground font-normal">by Saaspro</span>
          </h1>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {!isRunning ? (
            <div className="space-y-6">
              <CrawlerForm onConfigChange={setConfig} />
              
              <Button
                onClick={handleStart}
                className="w-full gradient-primary shadow-elegant hover:shadow-glow transition-all"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Iniciar Rastreamento
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <ProgressDisplay
                status={status}
                isLoading={isLoading}
                visited={visited}
                queue={queue}
                written={written}
                processed={processed}
                externalSkips={externalSkips}
                progressPercent={progressPercent}
                eta={eta}
                showWarmup={showWarmup}
                warmupProgress={warmupProgress}
                warmupMessage={warmupMessage}
                warmupCountdown={warmupCountdown}
              />

              <Button
                onClick={handleStop}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <Square className="mr-2 h-5 w-5" />
                Parar Rastreamento
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleDashboard} variant="secondary">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button onClick={handleExport} variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
