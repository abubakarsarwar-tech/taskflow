import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { SuggestionOptions } from '@tiptap/suggestion';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Link as LinkIcon,
    Upload,
    Heading1,
    Heading2,
    Heading3,
    Pilcrow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCallback, useRef } from 'react';
import * as api from '@/api';
import { toast } from 'sonner';
import { TeamMember } from '@/types/task';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    className?: string;
    minimal?: boolean;
    onImageUpload?: (file: File) => Promise<string>;
    members?: TeamMember[];
}

export function RichTextEditor({
    content,
    onChange,
    onBlur,
    placeholder = 'Start typing...',
    className,
    minimal = false,
    onImageUpload,
    members = []
}: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const mentionSuggestion: Partial<SuggestionOptions> = {
        items: ({ query }: { query: string }) => {
            return members
                .filter(member =>
                    member.name.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, 5);
        },
        render: () => {
            let popup: any;
            let element: HTMLDivElement;

            return {
                onStart: (props: any) => {
                    element = document.createElement('div');
                    element.className = 'mention-dropdown bg-popover border border-border rounded-lg shadow-lg p-2 max-h-60 overflow-auto z-50';

                    const renderList = () => {
                        const items = props.items as TeamMember[];
                        if (items.length === 0) {
                            element.innerHTML = '<div class="px-3 py-2 text-sm text-muted-foreground">No members found</div>';
                            return;
                        }

                        element.innerHTML = items
                            .map((item, index) => `
                                <button
                                    class="mention-item w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors hover:bg-accent"
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
                            `)
                            .join('');

                        element.querySelectorAll('.mention-item').forEach((button, index) => {
                            button.addEventListener('mousedown', (e) => {
                                e.preventDefault();
                                props.command({ id: items[index].id, label: items[index].name });
                            });
                        });
                    };

                    renderList();

                    popup = tippy('body', {
                        getReferenceClientRect: props.clientRect,
                        appendTo: () => document.body,
                        content: element,
                        showOnCreate: true,
                        interactive: true,
                        trigger: 'manual',
                        placement: 'bottom-start',
                    });
                },
                onUpdate(props: any) {
                    const items = props.items as TeamMember[];
                    if (items.length === 0) {
                        element.innerHTML = '<div class="px-3 py-2 text-sm text-muted-foreground">No members found</div>';
                    } else {
                        element.innerHTML = items
                            .map((item, index) => `
                                <button
                                    class="mention-item w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors hover:bg-accent"
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
                            `)
                            .join('');

                        element.querySelectorAll('.mention-item').forEach((button, index) => {
                            button.addEventListener('mousedown', (e) => {
                                e.preventDefault();
                                props.command({ id: items[index].id, label: items[index].name });
                            });
                        });
                    }

                    popup?.[0]?.setProps({
                        getReferenceClientRect: props.clientRect,
                    });
                },
                onExit() {
                    popup?.[0]?.destroy();
                    element?.remove();
                },
            };
        },
    };

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer hover:text-primary/80',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention bg-primary/10 text-primary px-1 rounded font-medium',
                },
                suggestion: mentionSuggestion,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onBlur: () => {
            onBlur?.();
        },
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] px-3 py-2',
                    className
                ),
            },
        },
    });

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const addImage = useCallback(() => {
        if (!editor) return;

        const url = window.prompt('Image URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editor) return;
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            let imageUrl: string;

            if (onImageUpload) {
                imageUrl = await onImageUpload(file);
            } else {
                // Default upload using API
                const token = localStorage.getItem('taskflow_token');
                if (!token) {
                    toast.error('Please login to upload images');
                    return;
                }
                const response = await api.uploadImage(token, file) as any;
                imageUrl = response.data.url;
            }

            editor.chain().focus().setImage({ src: imageUrl }).run();
            toast.success('Image uploaded');
        } catch (error) {
            toast.error('Failed to upload image');
            console.error('Upload error:', error);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [editor, onImageUpload]);

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-border rounded-xl bg-background/50 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 w-8 p-0 rounded-lg",
                        editor.isActive('bold') && 'bg-primary/20 text-primary'
                    )}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 w-8 p-0 rounded-lg",
                        editor.isActive('italic') && 'bg-primary/20 text-primary'
                    )}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                {!minimal && (
                    <>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 w-8 p-0 rounded-lg",
                                editor.isActive('heading', { level: 1 }) && 'bg-primary/20 text-primary'
                            )}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            title="Heading 1"
                        >
                            <Heading1 className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 w-8 p-0 rounded-lg",
                                editor.isActive('heading', { level: 2 }) && 'bg-primary/20 text-primary'
                            )}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            title="Heading 2"
                        >
                            <Heading2 className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 w-8 p-0 rounded-lg",
                                editor.isActive('heading', { level: 3 }) && 'bg-primary/20 text-primary'
                            )}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            title="Heading 3"
                        >
                            <Heading3 className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 w-8 p-0 rounded-lg",
                                editor.isActive('paragraph') && 'bg-primary/20 text-primary'
                            )}
                            onClick={() => editor.chain().focus().setParagraph().run()}
                            title="Paragraph"
                        >
                            <Pilcrow className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-6 bg-border mx-1" />
                    </>
                )}

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 w-8 p-0 rounded-lg",
                        editor.isActive('bulletList') && 'bg-primary/20 text-primary'
                    )}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 w-8 p-0 rounded-lg",
                        editor.isActive('orderedList') && 'bg-primary/20 text-primary'
                    )}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>

                {!minimal && (
                    <>
                        <div className="w-px h-6 bg-border mx-1" />

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 w-8 p-0 rounded-lg",
                                editor.isActive('link') && 'bg-primary/20 text-primary'
                            )}
                            onClick={setLink}
                            title="Add Link"
                        >
                            <LinkIcon className="h-4 w-4" />
                        </Button>

                        {onImageUpload && (
                            <>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Upload Image"
                                >
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}
