import { ReactRenderer } from '@tiptap/react';
import Mention from '@tiptap/extension-mention';
import { SuggestionOptions } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { TeamMember } from '@/types/task';

interface MentionListProps {
    items: TeamMember[];
    command: (item: TeamMember) => void;
}

class MentionList {
    private items: TeamMember[];
    private command: (item: TeamMember) => void;
    private selectedIndex: number;
    private element: HTMLDivElement;

    constructor({ items, command }: MentionListProps) {
        this.items = items;
        this.command = command;
        this.selectedIndex = 0;
        this.element = document.createElement('div');
        this.element.className = 'mention-list bg-popover border border-border rounded-lg shadow-lg p-2 max-h-60 overflow-auto';
        this.render();
    }

    onKeyDown({ event }: { event: KeyboardEvent }): boolean {
        if (event.key === 'ArrowUp') {
            this.upHandler();
            return true;
        }

        if (event.key === 'ArrowDown') {
            this.downHandler();
            return true;
        }

        if (event.key === 'Enter') {
            this.enterHandler();
            return true;
        }

        return false;
    }

    upHandler() {
        this.selectedIndex = ((this.selectedIndex + this.items.length) - 1) % this.items.length;
        this.render();
    }

    downHandler() {
        this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
        this.render();
    }

    enterHandler() {
        this.selectItem(this.selectedIndex);
    }

    selectItem(index: number) {
        const item = this.items[index];
        if (item) {
            this.command(item);
        }
    }

    updateProps(props: MentionListProps) {
        this.items = props.items;
        this.command = props.command;
        this.render();
    }

    render() {
        if (this.items.length === 0) {
            this.element.innerHTML = '<div class="px-3 py-2 text-sm text-muted-foreground">No members found</div>';
            return;
        }

        this.element.innerHTML = this.items
            .map((item, index) => {
                const isSelected = index === this.selectedIndex;
                return `
          <button
            class="mention-item w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                    }"
            data-index="${index}"
          >
            <div class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
              ${item.name.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">${item.name}</div>
              ${item.email ? `<div class="text-xs text-muted-foreground truncate">${item.email}</div>` : ''}
            </div>
          </button>
        `;
            })
            .join('');

        // Add click handlers
        this.element.querySelectorAll('.mention-item').forEach((button, index) => {
            button.addEventListener('click', () => this.selectItem(index));
        });
    }

    destroy() {
        this.element.remove();
    }
}

export const createMentionExtension = (members: TeamMember[]) => {
    return Mention.configure({
        HTMLAttributes: {
            class: 'mention bg-primary/10 text-primary px-1 rounded',
        },
        suggestion: {
            items: ({ query }: { query: string }) => {
                return members
                    .filter(member =>
                        member.name.toLowerCase().includes(query.toLowerCase())
                    )
                    .slice(0, 5);
            },
            render: () => {
                let component: ReactRenderer<MentionList> | undefined;
                let popup: TippyInstance[] | undefined;

                return {
                    onStart: (props: any) => {
                        component = new ReactRenderer(MentionList as any, {
                            props,
                            editor: props.editor,
                        });

                        if (!props.clientRect) {
                            return;
                        }

                        popup = tippy('body', {
                            getReferenceClientRect: props.clientRect,
                            appendTo: () => document.body,
                            content: component.element,
                            showOnCreate: true,
                            interactive: true,
                            trigger: 'manual',
                            placement: 'bottom-start',
                        });
                    },

                    onUpdate(props: any) {
                        component?.updateProps(props);

                        if (!props.clientRect) {
                            return;
                        }

                        popup?.[0]?.setProps({
                            getReferenceClientRect: props.clientRect,
                        });
                    },

                    onKeyDown(props: any) {
                        if (props.event.key === 'Escape') {
                            popup?.[0]?.hide();
                            return true;
                        }

                        return component?.ref?.onKeyDown(props) ?? false;
                    },

                    onExit() {
                        popup?.[0]?.destroy();
                        component?.destroy();
                    },
                };
            },
        } as Partial<SuggestionOptions>,
    });
};
