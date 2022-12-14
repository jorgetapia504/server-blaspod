import pkg from 'transbank-sdk'
import {asyncHandler} from '../utils/async_handler.js'
const { WebpayPlus, Environment, Options } = pkg

export const create = asyncHandler(async function (req, res) {
  const { buyOrder, sessionId, amount, returnUrl } = req.body
  const createResponse = await (new WebpayPlus.Transaction(new Options(process.env.TRANSBANK_COMMERCECODE, process.env.TRANSBANK_APIKEYS, Environment.Production))).create(
    buyOrder,
    sessionId,
    amount,
    returnUrl
  )
  res.send(createResponse)
})

export const commit = asyncHandler(async function (req, res) {
  try {
    let { token } = req.body
    const commitResponse = await (new WebpayPlus.Transaction()).commit(token)
    res.send(commitResponse)
  } catch (error) {
    return res.status(204).json({message: 'Pago no realizado'})
  }
})

export const status = asyncHandler(async function (req, res) {
  let { token } = req.body
  const statusResponse = await (new WebpayPlus.Transaction()).status(token)
  let viewData = {
    token,
    statusResponse,
  }
  res.send(viewData)
})

export const refund = asyncHandler(async function (req, res) {
  let { token, amount } = req.body
  const refundResponse = await (new WebpayPlus.Transaction()).refund(token, amount)
  let viewData = {
    token,
    amount,
    refundResponse,
  }
  res.send(viewData)
})