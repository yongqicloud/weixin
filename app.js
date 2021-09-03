const Koa = require('koa')
const path = require('path')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const app = new Koa()
const port = 3333
const views = require('koa-views');
const router = new Router()

const weixinRouter = require('./router/')
router.use('/',weixinRouter.routes())

app.use(bodyParser());
app.use(views(path.join(__dirname, './views'), {
  extension: 'ejs'
}));

app.use(router.routes())

app.listen(port,()=>{
  console.log(`runing:localhost:${port}`)
})