import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDocumentTitle } from '../useDocumentTitle';

function Probe(props: { title: string; description?: string; noindex?: boolean }) {
  useDocumentTitle(props.title, { description: props.description, noindex: props.noindex });
  return null;
}

const robots = () => document.head.querySelector('meta[name="robots"]')?.getAttribute('content');

beforeEach(() => {
  document.head.innerHTML = '';
});

describe('useDocumentTitle (audit: SEO per route)', () => {
  it('sets the document title', () => {
    render(<Probe title="Hello" />);
    expect(document.title).toBe('Hello');
  });

  it('marks private pages noindex, nofollow', () => {
    render(<Probe title="Board" noindex />);
    expect(robots()).toBe('noindex, nofollow');
  });

  it('marks public pages index, follow', () => {
    render(<Probe title="Home" />);
    expect(robots()).toBe('index, follow');
  });

  it('switches back to indexable when noindex is removed', () => {
    const { rerender } = render(<Probe title="x" noindex />);
    rerender(<Probe title="x" />);
    expect(robots()).toBe('index, follow');
  });

  it('sets the meta description only when given', () => {
    render(<Probe title="a" />);
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    render(<Probe title="a" description="About" />);
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute('content', 'About');
  });

  it('updates canonical for indexable pages but leaves it alone for noindex pages', () => {
    document.head.innerHTML = '<link rel="canonical" href="https://old.example/">';
    render(<Probe title="a" noindex />);
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href).toBe('https://old.example/');
    render(<Probe title="a" />);
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href).toBe(`${window.location.origin}/`);
  });
});
