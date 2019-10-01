const Mail = use('Mail');
const Hash = use('Hash');
const Database = use('Database');
const { subHours, format } = require('date-fns');
const {test, trait, beforeEach, afterEach} = use('Test/Suite')('Forgot Password');

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory');

trait('Test/ApiClient')
trait('DatabaseTransactions')

beforeEach(() => {
    Mail.fake()
})

afterEach(() => {
    Mail.restore()
})

test('it should send an email with reset password instructions', async ({ assert, client }) => {
    Mail.fake()

    const email = 'devfilsk@gmail.com';

    const user = await Factory
        .model('App/Models/User')
        .create({ email });

    await client
        .post('/forgot')
        .send({ email })
        .end();

    const token = await user.tokens().first();

    const recentEmail = Mail.pullRecent();

    assert.equal(recentEmail.message.to[0].address, email)

    assert.include(token.toJSON(), {
        type: 'forgotpassword'
    })

    Mail.restore()
});

test('it should be able to reset password', async ({ assert, client}) => {
    const email = 'devfilsk@gmail.com';
    
    const user = await Factory.model('App/Models/User').create({ email });
    const userToken = await Factory.model('App/Models/Token').make();

    await user.tokens().save(userToken);

    const response = await client
        .post('/reset')
        .send({
            token: userToken.token, 
            password: 'secret',
            password_confirmation: 'secret' 
        })
        .end()

    response.assertStatus(204)

    await user.reload();
    const checkPassword = await Hash.verify('secret', user.password);

    assert.isTrue(checkPassword);
})

test('it cannot reset password after 2h of forgot password request', async ({ assert, client }) => {
    const email = 'devfilsk@gmail.com';
    
    const user = await Factory.model('App/Models/User').create({ email });
    const userToken = await Factory.model('App/Models/Token').make();

    await user.tokens().save(userToken);

    const dateWithSub = format(subHours(new Date(), 2), 'yyyy-MM-dd HH:ii:ss');

    await Database
        .table('tokens')
        .where('token', userToken.token)
        .update('created_at', dateWithSub)

    await userToken.reload();

    const response = await client
    .post('/reset')
    .send({
        token: userToken.token, 
        password: 'secret',
        password_confirmation: 'secret' 
    })
    .end()

    response.assertStatus(400);
})