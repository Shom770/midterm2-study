'use client';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { java } from '@codemirror/lang-java';
import { bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { highlighter, ocamlLanguage } from '@/lib/highlight';



const theme = EditorView.theme(
  {
    '&': { backgroundColor: '#000', color: '#e6e9ef', fontSize: '13px', border: '1px solid #333', borderRadius: '6px' },
    '&.cm-focused': { outline: 'none', borderColor: '#9a9a9a' },
    '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.6', fontVariantLigatures: 'none' },
    '.cm-content': { padding: '12px 0', caretColor: '#fff' },
    '.cm-gutters': { backgroundColor: '#000', color: '#4a4a4a', border: 'none', paddingLeft: '6px' },
    // Translucent: the selection layer is drawn underneath the lines, so an opaque
    // active-line colour would hide a selection on the cursor's line.
    '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.045)' },
    '.cm-activeLineGutter': { backgroundColor: '#101010', color: '#9a9a9a' },
    '.cm-cursor': { borderLeftColor: '#fff' },
    // Selection is drawn as a layer behind the text, so keep the text its own colour.
    '.cm-selectionBackground': { backgroundColor: 'rgba(138, 180, 255, 0.22) !important' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(138, 180, 255, 0.34) !important' },
    '.cm-content ::selection': { backgroundColor: 'transparent !important' },
    '.cm-selectionMatch': { backgroundColor: 'rgba(138, 180, 255, 0.14)' },
    '.cm-matchingBracket': { backgroundColor: '#262626', outline: '1px solid #555' },
  },
  { dark: true },
);

type Props = {
  value: string;
  onChange: (v: string) => void;
  lang: 'ocaml' | 'java';
  onRun?: () => void;
  label: string;
};

/** A CodeMirror 6 editor. `value` is read on mount and when it changes from outside (e.g. reset). */
export function CodeEditor({ value, onChange, lang, onRun, label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef({ onChange, onRun });
  cb.current = { onChange, onRun };

  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightActiveLine(),
          EditorState.tabSize.of(2),
          keymap.of([
            { key: 'Mod-Enter', run: () => (cb.current.onRun?.(), true) },
            indentWithTab,
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          lang === 'java' ? java() : ocamlLanguage,
          syntaxHighlighting(highlighter),
          theme,
          EditorView.contentAttributes.of({ 'aria-label': label }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) cb.current.onChange(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // The editor is created once per language; `value` changes are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} className="editor" />;
}
