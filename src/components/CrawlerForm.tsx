import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Settings } from "lucide-react";

export interface CrawlConfig {
  url: string;
  targetDomain?: string;
  maxDepth: number;
  maxExternalDistinct: number;
  excludeDomains: string[];
  useOAuth2: boolean;
}

interface CrawlerFormProps {
  onConfigChange: (config: CrawlConfig) => void;
}

const FORM_KEY = 'scrappo_form_v2';

export const CrawlerForm = ({ onConfigChange }: CrawlerFormProps) => {
  const [config, setConfig] = useState<CrawlConfig>({
    url: '',
    targetDomain: '',
    maxDepth: 5,
    maxExternalDistinct: 1,
    excludeDomains: [],
    useOAuth2: false,
  });

  useEffect(() => {
    // Load saved config
    try {
      const saved = localStorage.getItem(FORM_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        onConfigChange(parsed);
      }
    } catch (e) {
      console.error('Failed to load saved config', e);
    }
  }, []);

  const updateConfig = (updates: Partial<CrawlConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange(newConfig);
    
    // Save to localStorage
    try {
      localStorage.setItem(FORM_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save config', e);
    }
  };

  const normalizeUrl = (url: string) => {
    let normalized = url.trim();
    if (normalized && !/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url" className="font-semibold">URL Principal</Label>
        <Input
          id="url"
          type="url"
          placeholder="seusite.com.br"
          value={config.url}
          onChange={(e) => updateConfig({ url: e.target.value })}
          onBlur={(e) => updateConfig({ url: normalizeUrl(e.target.value) })}
          className="transition-all"
        />
      </div>

      <div className="border border-info-border bg-info-bg rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-xl">⏱️</span>
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">Primeiro ciclo leva ~70s</p>
            <p className="text-xs text-muted-foreground">
              Durante esse "aquecimento" montamos a fila, ajustamos o trigger e buscamos sitemaps. 
              Depois disso, os resultados passam a aparecer em ritmo normal.
            </p>
          </div>
        </div>
      </div>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 w-full border border-border rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors">
          <Settings className="h-4 w-4" />
          <span className="font-semibold flex-1 text-left">Configurações Avançadas</span>
          <ChevronDown className="h-4 w-4 transition-transform ui-expanded:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetDomain" className="font-semibold">
              Domínio Alvo <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="targetDomain"
              value={config.targetDomain}
              onChange={(e) => updateConfig({ targetDomain: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDepth" className="font-semibold">Profundidade</Label>
            <Input
              id="maxDepth"
              type="number"
              min="1"
              max="10"
              value={config.maxDepth}
              onChange={(e) => updateConfig({ maxDepth: Math.min(10, Math.max(1, Number(e.target.value))) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxExternalDomains" className="font-semibold">Domínios Externos</Label>
            <Input
              id="maxExternalDomains"
              type="number"
              min="0"
              max="10"
              value={config.maxExternalDistinct}
              onChange={(e) => updateConfig({ maxExternalDistinct: Math.min(10, Math.max(0, Number(e.target.value))) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excludeDomains" className="font-semibold">
              Excluir Domínios <span className="text-xs text-muted-foreground">(separe por vírgulas)</span>
            </Label>
            <Textarea
              id="excludeDomains"
              value={config.excludeDomains.join(', ')}
              onChange={(e) => updateConfig({ 
                excludeDomains: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
              })}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="useOAuth2"
                checked={config.useOAuth2}
                onCheckedChange={(checked) => updateConfig({ useOAuth2: !!checked })}
              />
              <Label htmlFor="useOAuth2" className="font-semibold cursor-pointer">
                Usar OAuth2 (Avançado)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Requer credenciais em Script Properties.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
