import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
    X,
    MessageSquare,
    Send,
    Reply,
    MoreHorizontal,
    Trash2,
    User as UserIcon,
    Paperclip,
    AtSign,
    File,
    FileText,
    Download,
    FileImage,
    FileVideo,
    FileArchive
} from 'lucide-react';
import { Task, Comment, TeamMember } from '@/types/task';
import { useTaskStore } from '@/store/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/api';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Helper function to get file icon based on MIME type
function getFileIcon(type: string) {
    if (type.startsWith('image/')) {
        return <FileImage className="h-4 w-4 text-muted-foreground" />;
    } else if (type.startsWith('video/')) {
        return <FileVideo className="h-4 w-4 text-muted-foreground" />;
    } else if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) {
        return <FileArchive className="h-4 w-4 text-muted-foreground" />;
    } else if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    } else {
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
}

interface TaskDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
}

export function TaskDetailModal({ open, onOpenChange, task }: TaskDetailModalProps) {
    const { user } = useAuth();
    const { fetchComments, addComment, updateComment, deleteComment, updateTask, boards, currentBoardId } = useTaskStore();

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<Comment | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [attachments, setAttachments] = useState<Array<{ url: string; name: string; type: string }>>([]);
    const [showMentions, setShowMentions] = useState(false);

    const [description, setDescription] = useState(task?.description || '');
    const [content, setContent] = useState(task?.content || '');
    const [isSavingTask, setIsSavingTask] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && task) {
            loadComments();
            setDescription(task.description || '');
            setContent(task.content || '');
        }
    }, [open, task]);

    const handleSaveTask = async () => {
        if (!task) return;
        setIsSavingTask(true);
        try {
            await updateTask(task.id, {
                description,
                content
            });
            toast.success('Task updated');
        } catch (error) {
            toast.error('Failed to update task');
        } finally {
            setIsSavingTask(false);
        }
    };

    // Real-time comment listener
    useEffect(() => {
        const handleNewComment = (event: any) => {
            const comment = event.detail;
            if (open && task && comment.taskId === task.id) {
                setComments(prev => {
                    // Avoid duplicate if we were the one who added it
                    if (prev.some(c => (c.id === comment.id || c._id === comment.id))) return prev;
                    return [...prev, comment];
                });

                // Scroll to bottom
                setTimeout(() => {
                    if (scrollRef.current) {
                        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    }
                }, 100);
            }
        };

        const handleCommentUpdated = () => {
            if (open && task) {
                loadComments();
            }
        };

        const handleCommentDeleted = () => {
            if (open && task) {
                loadComments();
            }
        };

        window.addEventListener('new_comment_received', handleNewComment);
        window.addEventListener('comment_updated', handleCommentUpdated);
        window.addEventListener('comment_deleted', handleCommentDeleted);

        return () => {
            window.removeEventListener('new_comment_received', handleNewComment);
            window.removeEventListener('comment_updated', handleCommentUpdated);
            window.removeEventListener('comment_deleted', handleCommentDeleted);
        };
    }, [open, task]);

    const loadComments = async () => {
        if (!task) return;
        setLoading(true);
        try {
            const data = await fetchComments(task.id);
            setComments(data);
        } catch (error) {
            toast.error('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!task || !newComment.trim()) return;

        setSubmitting(true);
        try {
            await addComment(task.id, newComment.trim(), {
                parentId: replyTo?.id || replyTo?._id,
                attachments: attachments.length > 0 ? attachments : undefined
            });
            setNewComment('');
            setAttachments([]);
            setReplyTo(null);
            await loadComments();

            // Scroll to bottom after adding
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);

        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const token = localStorage.getItem('taskflow_token');
        if (!token) return;

        setUploading(true);
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const response = await api.uploadImage(token, file) as any;
                return {
                    url: response.data.url,
                    name: file.name,
                    type: file.type
                };
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            setAttachments(prev => [...prev, ...uploadedFiles]);
            toast.success(`${uploadedFiles.length} file(s) uploaded`);
        } catch (error) {
            toast.error('Failed to upload files');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };



    const handleMentionSelect = (member: TeamMember) => {
        // Remove the trailing @ before adding the mention
        const mention = `${member.name} `;
        const textWithoutTrailingAt = newComment.endsWith('@')
            ? newComment.slice(0, -1)
            : newComment;
        setNewComment(textWithoutTrailingAt + '@' + mention);
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    if (!task) return null;

    const currentBoard = Array.isArray(boards) ? boards.find(b => b.id === currentBoardId) : null;
    const members = currentBoard?.members || [];

    // Check if current user is admin or owner
    const boardOwnerId = currentBoard ? (
        typeof currentBoard.ownerId === 'object'
            ? (currentBoard.ownerId as any)._id || (currentBoard.ownerId as any).id
            : currentBoard.ownerId
    ) : null;

    const isOwner = boardOwnerId && user?.id ? String(boardOwnerId) === String(user.id) : false;
    const userMember = currentBoard?.members?.find((m) => String(m.id) === String(user?.id));
    const isAdmin = isOwner || userMember?.role === 'admin' || user?.role === 'admin';

    // Organize comments into threads
    const safeComments = Array.isArray(comments) ? comments : [];
    const rootComments = safeComments.filter(c => !c.parentId);
    const getReplies = (parentId: string) => safeComments.filter(c => (c.parentId === parentId));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass sm:max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden border-none">
                <DialogHeader className="p-6 pb-2 border-b border-border/50">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                                {task.title}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                View and manage task details and discussion.
                            </DialogDescription>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn(
                                    "capitalize",
                                    task.priority === 'urgent' && "bg-destructive/10 text-destructive border-destructive/20",
                                    task.priority === 'high' && "bg-orange-500/10 text-orange-600 border-orange-500/20",
                                )}>
                                    {task.priority} Priority
                                </Badge>
                                <span className="text-xs text-muted-foreground">in List {task.status}</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-8"
                    >
                        <div className="space-y-8">
                            {/* Description Section (Plain Text for Card) */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Description (Card Preview)
                                </h4>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={handleSaveTask}
                                    placeholder="Enter a short description for the card..."
                                    className="resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-colors rounded-xl min-h-[60px]"
                                />
                            </div>

                            {/* Task Content Section (Rich Text) */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <AtSign className="h-4 w-4" /> Task Content
                                </h4>
                                <RichTextEditor
                                    content={content}
                                    onChange={(newVal) => {
                                        setContent(newVal);
                                    }}
                                    onBlur={handleSaveTask}
                                    placeholder="Add detailed task content, tables, or lists..."
                                    className="min-h-[200px] bg-background/50 rounded-2xl border-none outline-none shadow-none"
                                    members={members}
                                />
                            </div>

                            {/* Resources Section */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" /> Attached Resources
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {task.resources && Array.isArray(task.resources) && task.resources.length > 0 ? (
                                        task.resources.map((resource, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border/50 group hover:border-primary/30 transition-all">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                        {getFileIcon(resource.type)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{resource.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {resource.size ? `${(resource.size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={resource.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 text-center py-6 border-2 border-dashed border-border/30 rounded-2xl">
                                            <p className="text-xs text-muted-foreground">No resources attached to this task.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" /> Discussion
                                </h4>

                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="flex gap-3 animate-pulse">
                                                <div className="h-8 w-8 rounded-full bg-muted" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 w-24 bg-muted rounded" />
                                                    <div className="h-10 bg-muted rounded-xl" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : rootComments.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-2xl">
                                        <p className="text-muted-foreground text-sm">No comments yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {rootComments.map(comment => (
                                            <CommentItem
                                                key={comment.id || comment._id}
                                                comment={comment}
                                                replies={getReplies((comment.id || comment._id) as string)}
                                                onReply={() => setReplyTo(comment)}
                                                onEdit={async (commentId, text) => {
                                                    await updateComment(commentId, text);
                                                }}
                                                onDelete={async () => {
                                                    await deleteComment((comment.id || comment._id) as string);
                                                }}
                                                currentUserId={user?.id}
                                                isAdmin={isAdmin}
                                                isOwner={isOwner}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Comment Input Section */}
                    <div className="p-6 bg-muted/30 border-t border-border/50 space-y-3">
                        {replyTo && (
                            <div className="flex items-center justify-between bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                                <p className="text-xs text-primary font-medium flex items-center gap-1">
                                    <Reply className="h-3 w-3" /> Replying to <span className="font-bold">{replyTo.userName}</span>
                                </p>
                                <button onClick={() => setReplyTo(null)} className="text-primary hover:text-primary/70 transition-colors">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}

                        <div className="flex gap-4 items-start">
                            <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-2">
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {attachments.map((file, index) => (
                                            <div key={index} className="relative group flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border">
                                                {getFileIcon(file.type)}
                                                <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                                                <button
                                                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                                    className="ml-1 text-destructive hover:text-destructive/80"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <RichTextEditor
                                    content={newComment}
                                    onChange={setNewComment}
                                    placeholder="Write a comment... Type @ to mention team members"
                                    className="min-h-[80px]"
                                    minimal={true}
                                    members={members}
                                />
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-1">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            multiple
                                            onChange={handleFileChange}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className={cn("h-8 w-8 rounded-lg text-muted-foreground hover:text-primary", uploading && "animate-pulse")}
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            title="Attach files"
                                        >
                                            <Paperclip className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <Button
                                        onClick={handleAddComment}
                                        disabled={submitting || uploading || !newComment.trim()}
                                        size="sm"
                                        className="rounded-xl px-4"
                                    >
                                        {submitting ? 'Posting...' : <><Send className="h-4 w-4 mr-2" /> Post</>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CommentItem({
    comment,
    replies,
    onReply,
    onEdit,
    onDelete,
    currentUserId,
    isAdmin,
    isOwner
}: {
    comment: Comment,
    replies: Comment[],
    onReply: () => void,
    onEdit: (commentId: string, text: string) => Promise<void>,
    onDelete: () => void,
    currentUserId?: string,
    isAdmin?: boolean,
    isOwner?: boolean
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [isSaving, setIsSaving] = useState(false);

    const isAuthor = comment.userId === currentUserId;
    const canDelete = isAuthor || isAdmin || isOwner;

    const handleSaveEdit = async () => {
        if (!editText.trim() || editText === comment.text) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            await onEdit((comment.id || comment._id) as string, editText.trim());
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update comment');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditText(comment.text);
        setIsEditing(false);
    };

    const processText = (text: string) => {
        if (!text) return text;
        const parts = text.split(/(@\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return (
                    <span key={i} className="text-primary font-bold hover:underline cursor-pointer">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="group space-y-3">
            <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.screenshotUrl} /> {/* Using this as a fallback for avatar if needed, but standard is UI avatar */}
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                        {comment.userName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{comment.userName}</span>
                            <span className="text-[10px] text-muted-foreground">
                                {comment.createdAt ? (() => {
                                    try {
                                        const date = new Date(comment.createdAt);
                                        return isNaN(date.getTime()) ? 'Just now' : format(date, 'MMM d, h:mm a');
                                    } catch (e) {
                                        return 'Just now';
                                    }
                                })() : 'Just now'}
                            </span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass">
                                <DropdownMenuItem onClick={onReply} className="text-xs">
                                    <Reply className="h-3 w-3 mr-2" /> Reply
                                </DropdownMenuItem>
                                {isAuthor && !isEditing && (
                                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-xs">
                                        <MessageSquare className="h-3 w-3 mr-2" /> Edit
                                    </DropdownMenuItem>
                                )}
                                {canDelete && (
                                    <DropdownMenuItem onClick={onDelete} className="text-xs text-destructive focus:text-destructive">
                                        <Trash2 className="h-3 w-3 mr-2" /> Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {isEditing ? (
                        <div className="space-y-2">
                            <RichTextEditor
                                content={editText}
                                onChange={setEditText}
                                className="min-h-[80px]"
                                minimal={true}
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    disabled={isSaving || !editText.trim()}
                                    className="h-7 text-xs rounded-full"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                    className="h-7 text-xs rounded-full"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-background/40 border border-border/50 rounded-2xl rounded-tl-none p-3 shadow-sm">
                                <div
                                    className="text-sm text-foreground/90 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: comment.text }}
                                />
                                {comment.screenshotUrl && (
                                    <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
                                        <img src={comment.screenshotUrl} alt="Attached image" className="max-h-48 w-auto object-cover" />
                                    </div>
                                )}
                                {comment.attachments && Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {comment.attachments.map((attachment: any, index: number) => (
                                            <a
                                                key={index}
                                                href={attachment.url || attachment}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors text-xs"
                                            >
                                                {getFileIcon(attachment.type || 'application/octet-stream')}
                                                <span className="truncate max-w-[120px]">
                                                    {attachment.name || 'File'}
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 px-1">
                                <button
                                    onClick={onReply}
                                    className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                                >
                                    Reply
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Nested Replies */}
            {replies.length > 0 && (
                <div className="pl-11 space-y-4 border-l border-border/50 ml-4 pt-1">
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.id || reply._id}
                            comment={reply}
                            replies={[]} // No deeper nesting supported for now for UI simplicity
                            onReply={onReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            isOwner={isOwner}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Simple text processing for mentions
function processText(text: string) {
    if (!text) return '';
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
        if (part.startsWith('@')) {
            return <span key={i} className="text-primary font-bold hover:underline cursor-pointer">{part}</span>;
        }
        return part;
    });
}
