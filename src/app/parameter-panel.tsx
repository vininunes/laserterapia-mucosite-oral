import type { ControlDef } from '../content/types'
import type { NumericParams } from '../state/hash-state'
import { Panel } from '../ui/panel'
import { Label } from '../ui/primitives/label'
import { Select } from '../ui/primitives/select'
import { Slider } from '../ui/primitives/slider'
import { Switch } from '../ui/primitives/switch'

interface ParameterPanelProps {
  controls: ControlDef[]
  params: NumericParams
  onChange(key: string, value: number): void
  onApply(values: NumericParams): void
  className?: string
}

const fmt = (v: number, step: number) => {
  const digits = Math.max(0, Math.ceil(-Math.log10(step)))
  return v.toFixed(digits).replace('.', ',')
}

export function ParameterPanel({ className, ...props }: ParameterPanelProps) {
  return (
    <Panel title="Parâmetros" className={className}>
      <ParameterControls {...props} />
    </Panel>
  )
}

/** Os controles sem o card: o layout de celular os mostra dentro da gaveta inferior. */
export function ParameterControls({ controls, params, onChange, onApply }: Omit<ParameterPanelProps, 'className'>) {
  return (
    <div className="flex flex-col gap-4">
      {controls.map((c) => {
        if (c.kind === 'presets') {
          return (
            <div key={c.label} className="flex flex-col gap-2">
              <Label className="text-xs">{c.label}</Label>
              {/* Sem valor controlado: é uma ação, volta ao placeholder depois de aplicar. */}
              <Select
                items={[c.options.map((o, i) => ({ value: String(i), name: o.label }))]}
                value=""
                placeholder={c.placeholder}
                onValueChange={(v) => onApply(c.options[Number(v)].values)}
                className="w-full text-xs"
              />
            </div>
          )
        }

        const id = `param-${c.key}`
        const value = params[c.key]

        if (c.kind === 'slider') {
          return (
            <div key={c.key} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={id} className="text-xs">
                  {c.label}
                </Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {fmt(value, c.step)}
                  {c.unit && ` ${c.unit}`}
                </span>
              </div>
              <Slider
                id={id}
                min={c.min}
                max={c.max}
                step={c.step}
                value={[value]}
                onValueChange={(v) => onChange(c.key, v[0])}
                aria-label={c.label}
              />
            </div>
          )
        }

        if (c.kind === 'select') {
          return (
            <div key={c.key} className="flex flex-col gap-2">
              <Label className="text-xs">{c.label}</Label>
              <Select
                items={[c.options.map((o) => ({ value: String(o.value), name: o.label }))]}
                value={String(value)}
                onValueChange={(v) => onChange(c.key, Number(v))}
                className="w-full text-xs"
              />
            </div>
          )
        }

        return (
          <div key={c.key} className="flex items-center justify-between gap-2">
            <Label htmlFor={id} className="text-xs">
              {c.label}
            </Label>
            <Switch id={id} checked={value === 1} onCheckedChange={(on) => onChange(c.key, on ? 1 : 0)} />
          </div>
        )
      })}
    </div>
  )
}
