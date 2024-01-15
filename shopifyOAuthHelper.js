const axios=require('axios');
const { error } = require('console');

const accessTokens = {};


const client_id = process.env.client_id;
const scope = process.env.scopes;

console.log(client_id);
console.log(scope);

const authorize= async (shop) =>{
    return encodeURI(`https://${shop}.myshopify.com/admin/oauth/authorize?client_id&scope&redirect_uri=${process.env.redirect_uri}`);
}

const redirect= async (code, shop) =>{
    console.log(code);
    let shopifyOAuthUrl=`https://${shop}/admin/oauth/access_token?client_id=${process.env.client_id}&client_secret=${process.env.client_secret}&code=${code}`;

    const {data} = await axios({
        url:shopifyOAuthUrl,
        method:'post',
        data:{}
    }).then(response=>{
        return response;
    }).catch(error=>{
        return error;
    });
    console.log(data);
    accessTokens[shop] = data.access_token;
    console.log(`Token for ${shop}: ${accessTokens[shop]}`);
    return data;
}


console.log(accessTokens[shop]);

module.exports = {
    authorize,
    redirect,
    accessTokens
};
