'use client';

import { useState, type FormEvent } from 'react';
import {
    Alert,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Icon,
} from '@/components/ui';
import CodeInput, { CODE_LENGTH } from './CodeInput';
import RetrievedTextPanel from './RetrievedTextPanel';
import RetrievedFilesPanel from './RetrievedFilesPanel';
import { getContent } from '@/services/shareService';
import type { RetrievedContent } from '@/services/shareService';

function RetrieveContent() {
    const [code, setCode] = useState('');
    const [content, setContent] = useState<RetrievedContent | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (code.length !== CODE_LENGTH) {
            setError('Please enter the full 4-digit code.');
            return;
        }

        setLoading(true);
        setError('');
        setContent(null);

        try {
            const data = await getContent(code);
            setContent(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to retrieve content');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setCode('');
        setContent(null);
        setError('');
    };

    return (
        <section>
            <Card>
                <CardHeader>
                    <CardTitle>Retrieve content</CardTitle>
                    <CardDescription>
                        Enter a 4-digit code to open the text or files shared with you.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <CodeInput value={code} onChange={setCode} disabled={loading} />

                        {error && <Alert variant="error">{error}</Alert>}

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-3">
                            {(code || content) && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleClear}
                                    disabled={loading}
                                    leftIcon={<Icon name="refresh" className="h-4 w-4" />}
                                >
                                    Clear
                                </Button>
                            )}
                            <Button
                                type="submit"
                                variant="brand"
                                loading={loading}
                                disabled={code.length !== CODE_LENGTH}
                                rightIcon={
                                    !loading ? <Icon name="arrowRight" className="h-4 w-4" /> : null
                                }
                            >
                                {loading ? 'Retrieving…' : 'Retrieve'}
                            </Button>
                        </div>
                    </form>

                    {content && (
                        <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-semibold text-slate-700">
                                {content.type === 'text' ? 'Retrieved text' : 'Retrieved files'}
                            </h3>
                            {content.type === 'text' ? (
                                <RetrievedTextPanel content={content.content} />
                            ) : (
                                <RetrievedFilesPanel
                                    code={code}
                                    files={content.files}
                                    onError={setError}
                                />
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}

export default RetrieveContent;
