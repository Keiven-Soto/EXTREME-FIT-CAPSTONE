const { Given, When, Then } = require('@wdio/cucumber-framework');

When(/^I tap the "Shop" tab$/, async () => {
    const shopTab = await $('~Shop'); // accessibility id for Shop tab
    await shopTab.waitForDisplayed({ timeout: 10000 });
    await shopTab.click();
});

Then(/^I should be on the Shop screen$/, async () => {
    // You can check for an element unique to Shop screen
    const shopScreenHeader = await $('~ShopScreen'); // adjust selector
    await shopScreenHeader.waitForDisplayed({ timeout: 10000 });
});
