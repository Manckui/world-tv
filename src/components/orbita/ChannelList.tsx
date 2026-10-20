import type { TvChannel } from "@/types/tv";
import { channelLocation } from "@/lib/orbita-catalog";
import { Icon } from "./Icon";
import { useLocale } from "./LocaleProvider";
import s from "./Orbita.module.scss";

export function FavoriteButton({ channel, favorite, onToggle }: {
  channel: TvChannel; favorite: boolean; onToggle: (id: string) => void;
}) {
  const { t } = useLocale();
  return <button className={`${s.iconButton} ${favorite ? s.isFavorite : ""}`}
    aria-label={t(favorite ? "Rimuovi {name} dai preferiti" : "Salva {name} nei preferiti", { name: channel.name })}
    aria-pressed={favorite} onClick={() => onToggle(channel.id)}>
    <Icon name="heart" />
  </button>;
}

export function ChannelList({ channels, favorites, onSelect, onToggle, selectedId }: {
  channels: TvChannel[]; favorites: string[]; onSelect: (channel: TvChannel) => void;
  onToggle: (id: string) => void; selectedId?: string;
}) {
  const { locale, t } = useLocale();
  return <ul className={s.channelList}>
    {channels.map(channel => <li key={channel.id} className={selectedId === channel.id ? s.activeChannel : ""}>
      <button className={s.channelRow} onClick={() => onSelect(channel)} aria-label={t("Guarda {name}", { name: channel.name })}>
        <span className={s.channelInitials} aria-hidden="true">{channel.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3)}</span>
        <span className={s.channelCopy}><strong>{channel.name}</strong><small>{channelLocation(channel, locale)}</small></span>
        <Icon name="arrow" />
      </button>
      <FavoriteButton channel={channel} favorite={favorites.includes(channel.id)} onToggle={onToggle} />
    </li>)}
  </ul>;
}
