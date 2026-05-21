'use client';

import { useState } from 'react';
import {
    Alert,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CodeDisplay,
    Icon,
    Textarea,
} from '@/components/ui';
import { uploadText } from '@/services/shareService';

const MAX_LENGTH = 10000;

function TextUploadSection() {
    const [textContent, setTextContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');

    const handleReset = () => {
        setTextContent('');
        setGeneratedCode('');
        setError('');
    };

    const handleSubmit = async () => {
        if (!textContent.trim()) {
            setError('Please enter some text to share.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const { code } = await uploadText(textContent);
            setGeneratedCode(code);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload text');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section>
            <Card>
                <CardHeader>
                    <CardTitle>Share text</CardTitle>
                    <CardDescription>
                        Paste a snippet, link, or note. We&apos;ll give you a 4-digit
                        code anyone can use to retrieve it.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Textarea
                        rows={8}
                        value={textContent}
                        onChange={(e) =>
                            setTextContent(e.target.value.slice(0, MAX_LENGTH))
                        }
                        placeholder="Paste or type your text here…"
                        invalid={Boolean(error)}
                    />

                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Plain text only · stays private to your code</span>
                        <span aria-live="polite">
                            {textContent.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
                        </span>
                    </div>

                    {error && <Alert variant="error">{error}</Alert>}

                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                        <Button
                            variant="secondary"
                            onClick={handleReset}
                            disabled={loading || (!textContent && !generatedCode)}
                            leftIcon={<Icon name="refresh" className="h-4 w-4" />}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="brand"
                            onClick={handleSubmit}
                            loading={loading}
                            rightIcon={!loading ? <Icon name="arrowRight" className="h-4 w-4" /> : null}
                        >
                            {loading ? 'Generating code…' : 'Generate code'}
                        </Button>
                    </div>

                    {generatedCode && (
                        <CodeDisplay
                            code={generatedCode}
                            helpText="Share this code with anyone — they can paste it on the Retrieve tab."
                        />
                    )}
                </CardContent>
            </Card>
        </section>
    );
}

export default TextUploadSection;
