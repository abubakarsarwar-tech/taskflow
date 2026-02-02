import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LabelColor } from '@/types/task';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
    selectedColor: LabelColor | string;
    onColorSelect: (color: LabelColor | string) => void;
    showCustomColor?: boolean;
    onDelete?: () => void;
}

const LABEL_COLORS: { color: LabelColor; class: string; name: string }[] = [
    { color: 'red', class: 'bg-label-red', name: 'Red' },
    { color: 'orange', class: 'bg-label-orange', name: 'Orange' },
    { color: 'yellow', class: 'bg-label-yellow', name: 'Yellow' },
    { color: 'green', class: 'bg-label-green', name: 'Green' },
    { color: 'blue', class: 'bg-label-blue', name: 'Blue' },
    { color: 'purple', class: 'bg-label-purple', name: 'Purple' },
    { color: 'pink', class: 'bg-label-pink', name: 'Pink' },
    { color: 'cyan', class: 'bg-label-cyan', name: 'Cyan' },
];

export function ColorPicker({ selectedColor, onColorSelect, showCustomColor = true, onDelete }: ColorPickerProps) {
    const [customColor, setCustomColor] = useState(typeof selectedColor === 'string' && !LABEL_COLORS.find(c => c.color === selectedColor) ? selectedColor : '#3b82f6');

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
                {LABEL_COLORS.map(({ color, class: colorClass, name }) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onColorSelect(color)}
                        className={cn(
                            "relative h-10 rounded-lg transition-all hover:scale-110",
                            colorClass,
                            selectedColor === color && "ring-2 ring-offset-2 ring-offset-background ring-primary"
                        )}
                        title={name}
                    >
                        {selectedColor === color && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Check className="h-5 w-5 text-white drop-shadow-lg" />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {showCustomColor && (
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Custom Color</label>
                    <div className="flex gap-2 items-center">
                        <Input
                            type="color"
                            value={customColor}
                            onChange={(e) => {
                                setCustomColor(e.target.value);
                                onColorSelect(e.target.value);
                            }}
                            className="h-10 w-20 cursor-pointer"
                        />
                        <Input
                            type="text"
                            value={customColor}
                            onChange={(e) => {
                                setCustomColor(e.target.value);
                                onColorSelect(e.target.value);
                            }}
                            placeholder="#000000"
                            className="flex-1 font-mono text-sm"
                        />
                    </div>
                </div>
            )}

            {onDelete && (
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                    className="w-full rounded-full"
                >
                    <X className="h-4 w-4 mr-2" />
                    Delete Label
                </Button>
            )}
        </div>
    );
}
