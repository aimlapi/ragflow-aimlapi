// src/components/AvailableModels.tsx
import { LlmIcon } from '@/components/svg-icon';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import { APIMapUrl, LLMFactory } from '@/constants/llm';
import { useFetchAvailableProviders } from '@/hooks/use-llm-request';
import { sortLLmFactoryListBySpecifiedOrder } from '@/utils/common-util';
import { ArrowUpRight, Plus, Star } from 'lucide-react';
import { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const mapModelKey = {
  image2text: 'VLM',
  speech2text: 'ASR',
  chat: 'LLM',
  vision: 'VLM',
  embedding: 'Embedding',
  asr: 'ASR',
  rerank: 'Rerank',
  tts: 'TTS',
  ocr: 'OCR',
};

const orderMap: Record<ModelType, number> = {
  chat: 1,
  embedding: 2,
  rerank: 3,
  tts: 4,
  asr: 5,
  speech2text: 5,
  image2text: 6,
  vision: 6,
  ocr: 7,
};

type ModelType =
  | 'chat'
  | 'embedding'
  | 'rerank'
  | 'tts'
  | 'asr'
  | 'speech2text'
  | 'image2text'
  | 'vision'
  | 'ocr';

const sortModelTypes = (modelTypes: string[]) => {
  return [...modelTypes].sort(
    (a, b) =>
      (orderMap[a as ModelType] || 999) - (orderMap[b as ModelType] || 999),
  );
};

/**
 * aimlapi.com brand logo (rounded hexagon with the pulse mark knocked out).
 * The two shapes are one even-odd path so the pulse is a transparent hole —
 * that keeps the logo monochrome (`currentColor`) and theme-adaptive, matching
 * the other provider icons instead of baking in a fixed fill. `<LlmIcon>` can't
 * do this for aimlapi because it renders provider SVGs as `<img>`, where
 * currentColor/classes don't reach inside.
 */
const AimlapiLogo: FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 34 30"
    className={className}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      fill="currentColor"
      d="M33.6575 13.218C34.296 14.3207 34.296 15.6793 33.6575 16.782L27.0356 28.218C26.3971 29.3207 25.2171 30 23.94 30H10.6963C9.41929 30 8.23925 29.3207 7.60073 28.218L0.97889 16.782C0.340367 15.6793 0.340371 14.3207 0.978895 13.218L7.60073 1.78204C8.23925 0.679309 9.41929 -5.56587e-08 10.6963 0L23.94 5.77212e-07C25.2171 6.3287e-07 26.3971 0.67931 27.0356 1.78204L33.6575 13.218ZM9.99264 19.9863C9.74359 19.9863 9.49298 19.9072 9.28129 19.7458C8.77073 19.3531 8.67423 18.6221 9.06804 18.113L13.7269 12.0756C13.9168 11.8289 14.1985 11.669 14.5067 11.6302C14.8211 11.5898 15.1293 11.6768 15.3737 11.8708L19.7633 15.3085L23.6033 10.3684C23.9987 9.85777 24.7303 9.7631 25.2408 10.1604C25.7514 10.5546 25.8448 11.2856 25.4494 11.7932L20.8887 17.6598C20.6988 17.9051 20.4186 18.0649 20.1104 18.1022C19.7991 18.1441 19.4909 18.0541 19.2449 17.8632L14.8585 14.427L10.9188 19.5316C10.6884 19.8296 10.3429 19.9863 9.99264 19.9863Z"
    />
  </svg>
);

export const AvailableModels: FC<{
  handleAddModel: (factory: string) => void;
}> = ({ handleAddModel }) => {
  const { t } = useTranslation();
  const { data: factoryList } = useFetchAvailableProviders();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const searchedModels = useMemo(() => {
    return factoryList.filter((model) =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [factoryList, searchTerm]);

  const filteredModels = useMemo(() => {
    const filtered =
      selectedTag === null
        ? searchedModels
        : searchedModels.filter((model) =>
            model.model_types.some((type) => type === selectedTag),
          );
    // AIMLAPI first (then RAGFlow's curated order) in the available list
    return sortLLmFactoryListBySpecifiedOrder(filtered as any) as typeof filtered;
  }, [searchedModels, selectedTag]);

  // Number of providers matching each tag, respecting the current search term so
  // the badge always reflects how many cards are shown when the tag is selected.
  const tagCounts = useMemo(() => {
    return searchedModels.reduce<Record<string, number>>((acc, model) => {
      // Count each provider once per model type, even if listed more than once.
      new Set(model.model_types).forEach((type) => {
        acc[type] = (acc[type] || 0) + 1;
      });
      return acc;
    }, {});
  }, [searchedModels]);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    factoryList.forEach((model) => {
      model.model_types.forEach((type) => tagsSet.add(type));
    });
    const res = sortModelTypes(Array.from(tagsSet));
    return res;
  }, [factoryList]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  return (
    <aside
      className="text-text-primary h-full flex flex-col"
      data-testid="available-models-section"
    >
      <header className="p-4 space-y-3">
        <h3 className="text-text-primary text-base">
          {t('setting.availableModels')}
        </h3>
        {/* Search Bar */}
        <div>
          {/* <div className="relative"> */}
          <SearchInput
            data-testid="model-providers-search"
            type="text"
            placeholder={t('setting.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-bg-input border border-border-default rounded-lg focus:outline-none focus:ring-1 focus:ring-border-button transition-colors"
          />
          {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" /> */}
          {/* </div> */}
        </div>

        {/* Tags Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedTag === null ? 'default' : 'secondary'}
            size="auto"
            className="leading-none px-1 py-0.5 rounded-sm text-xs"
            onClick={() => setSelectedTag(null)}
          >
            All
            <span className="ml-1 tabular-nums opacity-60">
              {searchedModels.length}
            </span>
          </Button>

          {allTags.map((tag) => (
            <Button
              variant={selectedTag === tag ? 'default' : 'secondary'}
              size="auto"
              className="leading-none px-1 py-0.5 rounded-sm text-xs"
              key={tag}
              onClick={() => handleTagClick(tag)}
            >
              {mapModelKey[tag.trim() as keyof typeof mapModelKey] ||
                tag.trim()}
              <span className="ml-1 tabular-nums opacity-60">
                {tagCounts[tag] ?? 0}
              </span>
            </Button>
          ))}
        </div>
      </header>

      {/* Models List */}
      <div className="@container p-4 pt-0 flex flex-col gap-4 overflow-auto h-full scrollbar-auto">
        {filteredModels.map((model) => (
          <div
            key={model.name}
            data-testid="available-model-card"
            data-provider={model.name}
            className="group border border-border-button rounded-lg p-3 hover:bg-bg-input transition-colors"
            onClick={() => handleAddModel(model.name)}
          >
            <div className="flex items-center gap-3 mb-3">
              {model.name === LLMFactory.AIMLAPI ? (
                <AimlapiLogo className="h-8 w-8 shrink-0 text-text-primary" />
              ) : (
                <LlmIcon
                  name={model.name}
                  imgClass="h-8 w-8 shrink-0 text-text-primary"
                />
              )}
              <div className="flex flex-1 min-w-0 gap-1.5 items-center">
                <div className="font-normal text-base truncate">
                  {model.name}
                </div>
                {!!APIMapUrl[model.name as keyof typeof APIMapUrl] && (
                  <Button
                    asLink
                    variant="ghost"
                    size="icon-xs"
                    className="size-4 shrink-0"
                    to={APIMapUrl[model.name as keyof typeof APIMapUrl]}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                      e.stopPropagation()
                    }
                  >
                    <ArrowUpRight size={16} />
                  </Button>
                )}
                {model.name === LLMFactory.AIMLAPI && (
                  // Recommended badge: the star always shows; the label appears
                  // only when the card (container) is wide enough to fit it
                  // alongside the Add button — otherwise it collapses to just
                  // the star.
                  <span
                    className="shrink-0 inline-flex items-center gap-1 text-state-success"
                    title={t('setting.recommended')}
                    aria-label={t('setting.recommended')}
                  >
                    <Star size={14} className="shrink-0 fill-current" />
                    <span className="hidden @[20rem]:inline text-xs font-medium whitespace-nowrap">
                      {t('setting.recommended')}
                    </span>
                  </span>
                )}
              </div>

              <Button
                size="xs"
                className="shrink-0 px-2 opacity-0 transition-all group-hover:opacity-100 group-focus-within:opacity-100"
              >
                <Plus size={12} />
                {t('setting.addTheModel')}
              </Button>
            </div>

            <div className="flex flex-wrap gap-1">
              {sortModelTypes(model.model_types).map((type, index) => (
                <span
                  key={index}
                  className="px-1 flex items-center h-5 text-xs bg-bg-card text-text-secondary rounded-md"
                >
                  {mapModelKey[type as keyof typeof mapModelKey] || type}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
