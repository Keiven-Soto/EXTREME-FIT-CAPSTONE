//--------------------------------------------------------
// LogIn Steps
//--------------------------------------------------------
Given(/^I open the app$/, async () => {
    await browser.pause(2000);
});

When(/^I tap on "([^"]*)" button$/, async (buttonText) => {
    const selector = `//*[@text="${buttonText}"]`;
    const button = await $(selector);
    await button.waitForDisplayed({ timeout: 10000 });
    await button.click();
    await browser.pause(2000);
});

When(/^I enter my test email$/, async () => {
    const emailField = await $('android=new UiSelector().text("Email address")');
    await emailField.waitForDisplayed({ timeout: 10000 });
    await emailField.click();
    await emailField.setValue(TEST_EMAIL);
    await browser.pause(1000);
});

When(/^I enter my test password$/, async () => {
    const passwordField = await $('android=new UiSelector().text("Password")');
    await passwordField.waitForDisplayed({ timeout: 10000 });
    await passwordField.click();
    await passwordField.setValue(TEST_PASSWORD);
    await browser.pause(1000);
});

When(/^I tap the login submit button$/, async () => {
    const loginButton = await $('//*[@text="LOG IN"]');
    await loginButton.waitForDisplayed({ timeout: 10000 });
    await loginButton.click();
    await browser.pause(1000);

    const stillVisible = await loginButton.isDisplayed().catch(() => false);
    if (stillVisible) {
        await loginButton.click();
        await browser.pause(1000);
    }

    await browser.pause(8000);
});

Then(/^I should see "([^"]*)" text$/, async (text) => {
    const selector = `//*[@text="${text}"]`;
    const element = await $(selector);
    await element.waitForDisplayed({ timeout: 10000 });
    await expect(element).toBeDisplayed();
});

Then(/^I should be on the create account screen$/, async () => {
    const selector = `//*[contains(@text, "Sign Up") or contains(@text, "Create") or contains(@text, "Email")]`;
    const element = await $(selector);
    await element.waitForDisplayed({ timeout: 10000 });
    await expect(element).toBeDisplayed();
});

Then(/^I should be on the login screen$/, async () => {
    const selector = `//*[contains(@text, "WELCOME BACK") or contains(@text, "Email address")]`;
    const element = await $(selector);
    await element.waitForDisplayed({ timeout: 10000 });
    await expect(element).toBeDisplayed();
});

Then(/^I should be logged into the app$/, async () => {
    await browser.pause(3000);
    const loginText = await $('//*[@text="WELCOME BACK"]');
    const isDisplayed = await loginText.isDisplayed().catch(() => false);
    await expect(isDisplayed).toBe(false);
});

Then(/^I should see the home screen$/, async () => {
    await browser.pause(5000);

    const homeText = await $('//*[contains(@text, "Loading categories") or contains(@text, "No categories") or contains(@text, "men") or contains(@text, "women")]');
    await homeText.waitForDisplayed({ timeout: 20000 });
    await expect(homeText).toBeDisplayed();
});
