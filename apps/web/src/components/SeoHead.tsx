import { useEffect } from 'react';

type SeoHeadProps = {
  title: string;
  description: string;
};

const DESCRIPTION_META_SELECTOR = 'meta[name="description"]';

export function SeoHead({ title, description }: SeoHeadProps) {
  useEffect(() => {
    document.title = title;

    let descriptionMeta = document.querySelector<HTMLMetaElement>(DESCRIPTION_META_SELECTOR);
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.setAttribute('name', 'description');
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute('content', description);
  }, [description, title]);

  return null;
}
