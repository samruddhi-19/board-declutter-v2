const SAFE_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM1ZTZjODQiIHN0cm9rZS13aWR0aD0iMiIgY3g9IjEyIiBjeT0iMTIiIHI9IjkiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjkiLz48L3N2Zz4=';

function calculateAgeFromId(cardId, customDateString) {
  const now = new Date();
  let targetDate;
  if (customDateString) {
    targetDate = new Date(customDateString);
  } else {
    const timestamp = parseInt(cardId.substring(0, 8), 16) * 1000;
    targetDate = new Date(timestamp);
  }
  return Math.floor(Math.abs(now - targetDate) / (1000 * 60 * 60 * 24));
}

const showSettingsMenu = function(t) {
  return t.popup({
    title: 'Card Aging Settings',
    items: [
      { text: 'Hide Badge for THIS card', callback: t => t.set('card', 'shared', 'badgeHidden', true).then(() => t.closePopup()) },
      { text: 'Reset Card age to 0', callback: t => t.set('card', 'shared', 'customStartDate', new Date().toISOString()).then(() => t.closePopup()) },
      { text: 'Set to Creation Date (Default)', callback: t => t.remove('card', 'shared', 'customStartDate').then(() => t.closePopup()) },
      { text: 'Select Age starting date', callback: t => t.popup({ title: 'Select Date', url: './date-picker.html', height: 250 }) }
    ]
  });
};

window.TrelloPowerUp.initialize({

  // 1. FRONT OF CARD
  'card-badges': function(t, opts) {
    return Promise.all([
      t.card('id'), 
      t.get('card', 'shared'),
      t.get('board', 'shared') 
    ]).then(function([card, cardData, boardData]) {
      
      if ((boardData && boardData.hideBadges) || (cardData && cardData.badgeHidden)) return []; 

      const daysAge = calculateAgeFromId(card.id, cardData?.customStartDate);

      // FIX: New cards now get a green badge so users/reviewers see it working instantly!
      let badgeColor = 'green';
      if (daysAge >= 3 && daysAge <= 5) badgeColor = 'yellow';
      if (daysAge >= 6 && daysAge <= 10) badgeColor = 'orange';
      if (daysAge > 10) badgeColor = 'red';

      return [{ text: `Age: ${daysAge}d`, color: badgeColor }];
    }).catch(e => { return []; });
  },

  // 2. INSIDE CARD (Small Badge)
  'card-detail-badges': function (t, opts) {
    return Promise.all([
      t.card('id'),
      t.get('card', 'shared'),
      t.get('board', 'shared')
    ]).then(function([card, cardData, boardData]) {
      
      if ((boardData && boardData.hideBadges) || (cardData && cardData.badgeHidden)) return []; 
      
      const daysAge = calculateAgeFromId(card.id, cardData?.customStartDate);
      return [{
        title: 'Total Age',
        text: `${daysAge} Days Old`,
        callback: function (t) { return showSettingsMenu(t); }
      }];
    }).catch(e => { return []; });
  },

  // 3. INSIDE CARD (Protect / un-protect toggle)
  // Not gated on hideBadges — that setting hides age badges, and protection has
  // to stay reachable from the card either way. The card's age is already shown
  // by the Total Age detail badge just above this section, so it is not repeated
  // here. card-protect.html calls sizeTo, so this height is only the starting
  // point.
  'card-back-section': function(t, options) {
    return {
      title: 'Board Declutter',
      icon: SAFE_ICON,
      content: { type: 'iframe', url: t.signUrl('./card-protect.html'), height: 88 }
    };
  },

  // 4. POWER-UP MENU SETTINGS (Kept as a fallback)
  'show-settings': function(t, options) {
    return t.popup({ title: 'Board Declutter', url: './declutter-menu.html', height: 180 });
  },

  // 5. TOP BOARD BUTTON
  // One button, one menu. Archiving used to sit beside this as a second button
  // wearing the same icon; it now lives in Declutter Preview, on the tab that
  // already lists the cards it would archive. The sweepEnabled setting still
  // switches the feature on and off — Preview reads it to show that button.
  'board-buttons': function(t, options) {
    return [{
      icon: { dark: SAFE_ICON, light: SAFE_ICON },
      text: '⚙️ Declutter Settings',
      callback: function(t) {
        return t.popup({ title: 'Board Declutter', url: './declutter-menu.html', height: 180 });
      }
    }];
  }
});
