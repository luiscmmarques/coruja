<script lang="ts">
	/**
	 * The contribute button — coruja's version of Graftful's "Donate ❤️", wearing a
	 * book instead of a heart, because that is what a contribution buys here.
	 *
	 * A plain link styled as a button, never PayPal's embedded button: theirs loads
	 * PayPal JavaScript, which the privacy promise and the CSP both forbid. A paypal.me
	 * page shows the account holder's name; that disclosure is made knowingly — the
	 * name is already in LICENSE.
	 *
	 * The URL lives here and only here, so the day it changes is a one-file edit.
	 */
	const PAYPAL_URL = 'https://paypal.me/LuisMarquesCH';

	let { label = 'Contribute with PayPal' }: { label?: string } = $props();
</script>

<a class="support" href={PAYPAL_URL} rel="noopener noreferrer" target="_blank">
	<span aria-hidden="true">📚</span>
	{label}
</a>

<style>
	.support {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: var(--tap);
		padding: 0.4rem 1.25rem;
		border: 1px solid var(--accent);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
	}

	.support:hover,
	.support:focus-visible {
		background: var(--accent);
		color: #fff;
	}

	.support span {
		font-size: 1.15em;
		line-height: 1;
	}
</style>
