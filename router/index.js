const Router = require('koa-router')
const router = new Router()
const weixin = require( '../controllers/weixin')

router.get('weixin',weixin.auth)
router.post('weixin',weixin.autoReply)
router.get('sign',weixin.sign)

module.exports = router