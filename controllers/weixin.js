const crypto = require('crypto')
const querystring = require('querystring')
const getRawBody = require('raw-body')
const contentType = require('content-type')
const config = require('../config/config')
const {
  parseString,
} = require('xml2js')
const {
  get
} = require('../utils/http')
// const xml2js = require('xml-js')
const {
  xml2js,
  genTimestamp,
  genNonceStr,
  genTimestampSecond
} = require('../utils/tools')
const auth = async (ctx, next) => {
  let token = 'weixin'
  let {
    signature,
    echostr,
    timestamp,
    nonce
  } = ctx.query
  let tempStr = [token, timestamp, nonce].sort().join('')
  let selfSign = crypto.createHash('sha1').update(tempStr).digest('hex')
  // console.log(echostr)
  if (signature === selfSign) {
    console.log('验证成功')
    ctx.body = echostr
  } else {
    ctx.body = '非法请求！'
  }
}

const autoReply = async (ctx, next) => {
  ctx.type = 'text/plain; charset=utf-8'
  let result = await getRawBody(ctx.req, {
    length: ctx.req.headers['content-length'],
    limit: '1mb',
    encoding: contentType.parse(ctx.req).parameters.charset
  })
  let xml = result.toString()
  let {
    ToUserName,
    FromUserName
  } = xml2js(xml)
  // parseString(xml, (err, result)=> {
  //     console.dir(result);
  // });
  let reply = {
    ToUserName: FromUserName,
    FromUserName: ToUserName,
    CreateTime: genTimestamp(),
    MsgType: 'text',
    Content: '<a href="http://baidu.com">点我抽奖</a>'
  }
  await ctx.render('reply', reply)

}

const _getTicket = async () => {
  // 获取 access_token
  let {
    access_token
  } = await get({
    url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appid}&secret=${config.secret}`
  })
  console.log(access_token)
  // 2. 获得 jsapi_ticket
  let {
    ticket
  } = await get({
    url: `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${access_token}&type=jsapi`
  })
  // console.log(ticket)
  return ticket
}
/**
 * 验证
 * @param {*} ctx 请求上下文
 * @param {*} next 中间件调用下一步
 */
const sign = async (ctx, next) => {
  // console.log('ctx:::', ctx.request)
  // ctx.body = 'nihao'
  // return;

  let ticket = await _getTicket()
  // 随机串
  let noncestr = genNonceStr()
  // 秒级时间戳
  let timestamp = genTimestampSecond()
  let fieldObj = {
    noncestr,
    timestamp,
    url: config.url,
    jsapi_ticket: ticket
  }
  // 字典排序
  let orderedFieldObj = Object.keys(fieldObj).sort().reduce((obj, key) => {
    obj[key] = fieldObj[key]
    return obj
  }, {})
  // String化
  let query = querystring.stringify(orderedFieldObj, null, null, {
    encodeURIComponent: (str) => {
      return querystring.unescape(str)
    }
  })
  // sha1加密
  let signature = crypto.createHash('sha1').update(query).digest('hex')
  console.log('签名', signature)

  // 返回接口
  ctx.body = {
    appId: config.appid,
    timestamp,
    nonceStr: noncestr,
    signature
  }
}

exports.auth = auth
exports.autoReply = autoReply
exports.sign = sign