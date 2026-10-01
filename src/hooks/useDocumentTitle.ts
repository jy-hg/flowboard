import { useEffect } from 'react';

interface PageMeta {
  description?: string;
  noindex?: boolean;
}

function setMeta(selector: string, create: () => HTMLElement, attr: string, value: string) {
  const element = document.head.querySelector<HTMLElement>(selector) ?? document.head.appendChild(create());
  element.setAttribute(attr, value);
}

export function useDocumentTitle(title: string, { description, noindex = false }: PageMeta = {}) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="robots"]', () => Object.assign(document.createElement('meta'), { name: 'robots' }), 'content', noindex ? 'noindex, nofollow' : 'index, follow');
    if (description) {
      setMeta('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' }), 'content', description);
    }
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical && !noindex) canonical.href = `${window.location.origin}${window.location.pathname}`;
  }, [title, description, noindex]);
}
