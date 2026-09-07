<script lang="ts">
	/**
	 * Badges: the ladder in full, the badges already earned, and the ones still waiting.
	 *
	 * Earned badges render from the label and emoji snapshotted on the EarnedBadge row, never from the live catalogue — that snapshot is the whole point of storing them (see badges.ts and types.ts): rewording a badge cannot rewrite a child's history.
	 *
	 * This screen shows one reader and only that reader. There is no comparison between readers anywhere on it, and nothing that frames an unearned badge as a shortfall — the locked section is "waiting for you", not "missing" (PLAN.md guardrails).
	 */
	import BadgeToken from '$lib/BadgeToken.svelte';
	import {
		booksStore,
		earnedBadgesStore,
		readersStore,
		readingsStore,
		settingsStore
	} from '$lib/db';
	import { BADGES } from '$lib/domain/badges';
	import { ladderPosition, LADDER_SIZE, RUNG_EMOJI } from '$lib/domain/ladder';
	import {
		familyFinishedBookCount,
		familyPagesRead,
		finishedInYear,
		longestFinished,
		monthlyPace,
		pagesRead,
		rereadCount,
		shelfReadPercent
	} from '$lib/domain/stats';
	import { t } from '$lib/i18n';
	import { locale } from '$lib/locale';

	/** Index 0 (nothing finished yet) through LADDER_SIZE (the top): every rung, always. */
	const RUNGS = RUNG_EMOJI.slice(0, LADDER_SIZE + 1);

	const readers = $derived(($readersStore ?? []).filter((r) => !r.archived));
	const activeReader = $derived(
		readers.find((r) => r.id === $settingsStore?.activeReaderId) ?? readers[0]
	);

	const ladder = $derived(
		activeReader ? ladderPosition($readingsStore ?? [], activeReader.id) : undefined
	);

	const books = $derived(($booksStore ?? []).filter((b) => !b.archived));
	const readings = $derived($readingsStore ?? []);
	const stats = $derived(
		activeReader
			? {
					pages: pagesRead(readings, books, activeReader.id),
					rereads: rereadCount(readings, activeReader.id),
					year: new Date().getFullYear(),
					thisYear: finishedInYear(readings, activeReader.id, new Date().getFullYear()),
					longest: longestFinished(readings, books, activeReader.id),
					pace: monthlyPace(readings, books, activeReader.id, Date.now()),
					shelfPercent: shelfReadPercent(readings, books, activeReader.id),
					familyBooks: familyFinishedBookCount(readings),
					familyPages: familyPagesRead(readings, books),
					familyShelfPercent: shelfReadPercent(readings, books, null)
				}
			: undefined
	);

	const earned = $derived(
		($earnedBadgesStore ?? [])
			.filter((badge) => badge.readerId === activeReader?.id)
			.toSorted((a, b) => b.earnedAt.localeCompare(a.earnedAt))
	);

	const earnedIds = $derived(new Set(earned.map((badge) => badge.badgeId)));
	const waiting = $derived(BADGES.filter((badge) => !earnedIds.has(badge.id)));

	function earnedDate(iso: string): string {
		return new Date(iso).toLocaleDateString($locale);
	}
</script>

<svelte:head>
	<title>{$t.badges.title} · coruja</title>
	<meta name="description" content={$t.badges.metaDescription} />
</svelte:head>

{#if $readersStore === undefined}
	<p class="muted">{$t.common.loading}</p>
{:else if !activeReader || !ladder}
	<section class="card">
		<h1>{$t.badges.title}</h1>
		<p>{$t.shelf.whoIsReading}</p>
		<p><a href="/">{$t.shelf.title}</a></p>
	</section>
{:else}
	<h1>{activeReader.emoji} {$t.badges.title}</h1>

	<section>
		<div class="card standing">
			<BadgeToken emoji={ladder.emoji} size={56} />
			<div>
				<strong>{$t.ladder.rungs[ladder.rung]}</strong>
				<p class="muted">
					{ladder.isFull ? $t.shelf.ladderFull : $t.shelf.ladderProgress(ladder.rung)}
					· {$t.shelf.booksFinished(ladder.finished)}
				</p>
			</div>
		</div>

		<ol class="rungs">
			{#each RUNGS as emoji, index (index)}
				<li
					class="rung"
					class:here={index === ladder.rung}
					aria-current={index === ladder.rung ? 'step' : undefined}
				>
					<BadgeToken {emoji} size={40} earned={index <= ladder.rung} />
					<span class="name">{$t.ladder.rungs[index]}</span>
				</li>
			{/each}
		</ol>
	</section>

	{#if stats && ladder && activeReader}
		<section>
			<h2>{$t.badges.statsTitle}</h2>
			<div class="stats">
				<div class="stat card">
					<strong>{ladder.finished}</strong>
					<span class="muted">{$t.shelf.booksFinished(ladder.finished)}</span>
				</div>
				<div class="stat card">
					<strong>{stats.pages.toLocaleString($locale)}</strong>
					<span class="muted">{$t.shelf.pagesRead(stats.pages)}</span>
				</div>
				{#if stats.rereads > 0}
					<div class="stat card">
						<strong>{stats.rereads}</strong>
						<span class="muted">{$t.badges.rereads(stats.rereads)}</span>
					</div>
				{/if}
				{#if stats.thisYear > 0}
					<div class="stat card">
						<strong>{stats.thisYear}</strong>
						<span class="muted">{$t.badges.finishedInYear(stats.year)}</span>
					</div>
				{/if}
				{#if stats.longest}
					<div class="stat card" title={stats.longest.title}>
						<strong>{stats.longest.pageCount.toLocaleString($locale)}</strong>
						<span class="muted">{$t.badges.longestBook}</span>
					</div>
				{/if}
				{#if stats.shelfPercent !== null && ladder.finished > 0}
					<div class="stat card">
						<strong>{stats.shelfPercent}%</strong>
						<span class="muted">{$t.badges.ofShelfRead}</span>
					</div>
				{/if}
				{#if stats.pace}
					<div class="stat card">
						<strong
							>{stats.pace.booksPerMonth.toLocaleString($locale, {
								maximumFractionDigits: 1
							})}</strong
						>
						<span class="muted">{$t.badges.booksAMonth}</span>
					</div>
					<div class="stat card">
						<strong>{Math.round(stats.pace.pagesPerMonth).toLocaleString($locale)}</strong>
						<span class="muted">{$t.badges.pagesAMonth}</span>
					</div>
				{/if}
			</div>

			{#if readers.length > 1}
				<h3 class="family-title">{$t.badges.familyTitle}</h3>
				<div class="stats">
					<div class="stat card">
						<strong>{books.length}</strong>
						<span class="muted">{$t.badges.booksOnShelf(books.length)}</span>
					</div>
					<div class="stat card">
						<strong>{stats.familyBooks}</strong>
						<span class="muted">{$t.shelf.booksFinished(stats.familyBooks)}</span>
					</div>
					<div class="stat card">
						<strong>{stats.familyPages.toLocaleString($locale)}</strong>
						<span class="muted">{$t.shelf.pagesRead(stats.familyPages)}</span>
					</div>
					{#if stats.familyShelfPercent !== null && stats.familyBooks > 0}
						<div class="stat card">
							<strong>{stats.familyShelfPercent}%</strong>
							<span class="muted">{$t.badges.ofShelfRead}</span>
						</div>
					{/if}
				</div>
			{/if}
		</section>
	{/if}

	<section>
		<h2>{$t.badges.earnedTitle}</h2>
		{#if earned.length === 0}
			<p class="muted">{$t.badges.none}</p>
		{:else}
			<ul class="badges">
				{#each earned as badge (badge.id)}
					<li class="badge card">
						<!-- Snapshotted emoji and label: the row as it was written, not the catalogue. -->
						<BadgeToken emoji={badge.emoji} size={48} />
						<div class="detail">
							<!-- Current translation first: the snapshot is frozen in whatever
							     language was active at earn time, and a family that switches
							     languages should not read last month's. The snapshot remains
							     the fallback for a badge id retired from the catalogue. -->
							<strong
								>{($t.badges.labels as Record<string, string>)[badge.badgeId] ??
									badge.label}</strong
							>
							<p class="muted">{$t.badges.earnedOn(earnedDate(badge.earnedAt))}</p>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if waiting.length > 0}
		<section>
			<h2>{$t.badges.lockedTitle}</h2>
			<ul class="badges">
				{#each waiting as badge (badge.id)}
					<li class="badge card waiting">
						<BadgeToken emoji={badge.emoji} size={48} earned={false} />
						<div class="detail">
							<strong>{$t.badges.labels[badge.id] ?? badge.id}</strong>
							{#if $t.badges.descriptions[badge.id]}
								<p class="muted">{$t.badges.descriptions[badge.id]}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
		gap: 0.5rem;
	}

	.stat {
		display: grid;
		gap: 0.1rem;
		text-align: center;
		padding: 0.75rem 0.5rem;
	}

	.stat strong {
		font-size: 1.5rem;
		color: var(--accent);
	}

	.stat .muted {
		font-size: 0.75rem;
	}

	.family-title {
		margin-top: 0.85rem;
		font-size: 0.8125rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink-soft);
	}

	section {
		margin-bottom: 1.25rem;
	}

	.standing {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}

	.rungs,
	.badges {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
	}

	/* Mobile-first: the ladder wraps rather than forcing a long scroll on a small screen. */
	.rungs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.rung {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.7rem 0.3rem 0.3rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface);
	}

	/* Where the reader stands. Never colour alone: the rung is also named and marked
	   with aria-current, so the highlight is decoration rather than the message. */
	.rung.here {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.rung.here .name {
		color: var(--accent);
		font-weight: 600;
	}

	.name {
		font-size: 0.875rem;
	}

	.badge {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.badge.waiting {
		background: none;
		border-style: dashed;
	}

	.detail {
		flex: 1;
		min-width: 0;
	}

	.detail p {
		margin: 0.1rem 0 0;
		font-size: 0.875rem;
	}

	@media (min-width: 30rem) {
		.rung {
			padding-right: 0.9rem;
		}

		.name {
			font-size: 0.9375rem;
		}
	}
</style>
