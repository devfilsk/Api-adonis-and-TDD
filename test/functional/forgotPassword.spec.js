const Mail = use('Mail');
const {test, trait} = use('Test/Suite')('Forgot Password');

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory');

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model*')} */
const User = use('App/Models/User');

trait('Test/ApiClient')
trait('DatabaseTransactions')

function generate(){
    
} 

test('it should send an email with reset password instructions', async ({ assert, client }) => {
    Mail.fake()
    const forgotPayload = {
        email: 'devfilsk@gmail.com',
    };
    const user = await Factory
        .model('App/Models/User')
        .create(forgotPayload);

    const response = await client
        .post('/forgot')
        .send(forgotPayload)
        .end();

    response.assertStatus(204);

    const recentEmail = Mail.pullRecent()
    assert.equal(recentEmail.message.to[0].address, forgotPayload.email)
    
    const token = await user.tokens().first();

    assert.include(token.toJSON(), {
        user_id: user.id,
        type: 'forgotPassword'
    })

    Mail.restore()
});

// chama uma rota /reset (token, senha nova, confirmação, senha precisa mudar)
// ele só vai resetar se o token tiver sido criado a menos de 2h
test('it shold reset password', async () => {

})
