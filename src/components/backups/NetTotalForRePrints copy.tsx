import { View } from "react-native"
import { TouchableRipple, Text } from "react-native-paper"
import normalize from "react-native-normalize"
import { useContext } from "react"
import { AppStore } from "../context/AppContext"
import { ShowBillData } from "../models/api_types"
import { gstFilterationAndTotalForRePrint } from "../utils/gstFilterTotalForRePrint"
import useCalculations from "../hooks/useCalculations"

type NetTotalForRePrintsProps = {
  backgroundColor: string
  textColor: string
  netTotal: number
  totalDiscount: number
  addedProductsList?: ShowBillData[]
  onPress?: () => void
  height?: number | "auto"
  width?: number
  disabled?: boolean
  cgst?: number
  sgst?: number
}

export default function NetTotalForRePrints({
  disabled = false,
  backgroundColor,
  textColor,
  addedProductsList,
  netTotal,
  totalDiscount,
  width = 320,
  height = "auto",
  cgst,
  sgst,
  onPress,
}: NetTotalForRePrintsProps) {
  const { receiptSettings } = useContext(AppStore)

  const {
    netTotalCalculate,
    netTotalWithGSTCalculate,
    roundingOffCalculate,
    grandTotalCalculate,
    roundingOffWithGSTCalculate,
    grandTotalWithGSTCalculate,
  } = useCalculations()

  // addedProductsList?.filter((item, i) => item.discount)
  let {
    totalCGST_5,
    totalCGST_12,
    totalCGST_18,
    totalCGST_28,
    totalSGST_5,
    totalSGST_12,
    totalSGST_18,
    totalSGST_28,
    totalGST,
  } = gstFilterationAndTotalForRePrint(addedProductsList)

  let gstFlag = addedProductsList[0]?.gst_flag
  let discountType = addedProductsList[0]?.discount_type

  return gstFlag !== "Y" ? (
    <TouchableRipple
      disabled={disabled}
      style={{
        width: normalize(width),
        height: height,
        backgroundColor: backgroundColor,
        alignSelf: "center",
        borderRadius: normalize(30),
        marginTop: normalize(15),
      }}
      onPress={onPress}>
      <View
        style={{
          margin: normalize(15),
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
        }}>
        <View>
          <Text style={{ color: textColor }}>TOTAL AMOUNT</Text>
          <Text style={{ color: textColor }}>DISCOUNT</Text>
          <Text style={{ color: textColor }}>NET TOTAL</Text>
          <Text style={{ color: textColor }}>ROUNDING OFF</Text>
          <Text style={{ color: textColor }}>GRAND TOTAL</Text>
        </View>
        <View>
          <Text style={{ color: textColor }}>₹{netTotal?.toFixed(2)}</Text>
          <Text style={{ color: textColor }}>₹{totalDiscount?.toFixed(2)}</Text>
          <Text style={{ color: textColor }}>
            ₹{/* {(netTotal - totalDiscount).toFixed(2)} */}
            {netTotalCalculate(netTotal, totalDiscount)}
          </Text>
          <Text style={{ color: textColor }}>
            ₹
            {/* {(Math.round(parseFloat((netTotal - totalDiscount).toFixed(2))) - parseFloat((netTotal - totalDiscount).toFixed(2))).toFixed(2)} */}
            {roundingOffCalculate(netTotal, totalDiscount)}
          </Text>
          <Text style={{ color: textColor }}>
            ₹
            {/* {Math.round(parseFloat((netTotal - totalDiscount).toFixed(2)))} */}
            {grandTotalCalculate(netTotal, totalDiscount)}
          </Text>
        </View>
      </View>
    </TouchableRipple>
  ) : (
    <TouchableRipple
      disabled={disabled}
      style={{
        width: normalize(width),
        height: height,
        backgroundColor: backgroundColor,
        alignSelf: "center",
        borderRadius: normalize(30),
        marginTop: normalize(15),
      }}
      onPress={onPress}>
      <View
        style={{
          margin: normalize(15),
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
        }}>
        <View>
          <Text style={{ color: textColor }}>TOTAL AMOUNT</Text>
          <Text style={{ color: textColor }}>DISCOUNT</Text>

          {totalCGST_5 > 0 && (
            <Text style={{ color: textColor }}>CGST @5%</Text>
          )}
          {totalSGST_5 > 0 && (
            <Text style={{ color: textColor }}>SGST @5%</Text>
          )}
          {totalCGST_12 > 0 && (
            <Text style={{ color: textColor }}>CGST @12%</Text>
          )}
          {totalSGST_12 > 0 && (
            <Text style={{ color: textColor }}>SGST @12%</Text>
          )}
          {totalCGST_18 > 0 && (
            <Text style={{ color: textColor }}>CGST @18%</Text>
          )}
          {totalSGST_18 > 0 && (
            <Text style={{ color: textColor }}>SGST @18%</Text>
          )}
          {totalCGST_28 > 0 && (
            <Text style={{ color: textColor }}>CGST @28%</Text>
          )}
          {totalSGST_28 > 0 && (
            <Text style={{ color: textColor }}>SGST @28%</Text>
          )}

          <Text style={{ color: textColor }}>NET TOTAL</Text>
          <Text style={{ color: textColor }}>ROUNDING OFF</Text>
          <Text style={{ color: textColor }}>GRAND TOTAL</Text>
        </View>
        <View>
          <Text style={{ color: textColor }}>₹{netTotal?.toFixed(2)}</Text>
          <Text style={{ color: textColor }}>₹{totalDiscount?.toFixed(2)}</Text>
          {/* <Text style={{ color: textColor }}>{cgst}%</Text>
            <Text style={{ color: textColor }}>{sgst}%</Text> */}

          {totalCGST_5 > 0 && (
            <Text style={{ color: textColor }}>
              {totalCGST_5 && totalCGST_5.toFixed(2)}
            </Text>
          )}
          {totalSGST_5 > 0 && (
            <Text style={{ color: textColor }}>
              {totalSGST_5 && totalSGST_5.toFixed(2)}
            </Text>
          )}
          {totalCGST_12 > 0 && (
            <Text style={{ color: textColor }}>
              {totalCGST_12 && totalCGST_12.toFixed(2)}
            </Text>
          )}
          {totalSGST_12 > 0 && (
            <Text style={{ color: textColor }}>
              {totalSGST_12 && totalSGST_12.toFixed(2)}
            </Text>
          )}
          {totalCGST_18 > 0 && (
            <Text style={{ color: textColor }}>
              {totalCGST_18 && totalCGST_18.toFixed(2)}
            </Text>
          )}
          {totalSGST_18 > 0 && (
            <Text style={{ color: textColor }}>
              {totalSGST_18 && totalSGST_18.toFixed(2)}
            </Text>
          )}
          {totalCGST_28 > 0 && (
            <Text style={{ color: textColor }}>
              {totalCGST_28 && totalCGST_28.toFixed(2)}
            </Text>
          )}
          {totalSGST_28 > 0 && (
            <Text style={{ color: textColor }}>
              {totalSGST_28 && totalSGST_28.toFixed(2)}
            </Text>
          )}

          <Text style={{ color: textColor }}>
            {/* {(netTotal - totalDiscount + totalGST).toFixed(2)} */}
            {netTotalWithGSTCalculate(netTotal, totalDiscount, totalGST)}
          </Text>

          <Text style={{ color: textColor }}>
            {/* {(Math.round(parseFloat((netTotal - totalDiscount + totalGST).toFixed(2))) - parseFloat((netTotal - totalDiscount + totalGST).toFixed(2))).toFixed(2)} */}
            {roundingOffWithGSTCalculate(netTotal, totalDiscount, totalGST)}
          </Text>

          <Text style={{ color: textColor }}>
            ₹
            {/* {Math.round(parseFloat((netTotal - totalDiscount + totalGST).toFixed(2))).toFixed(2)} */}
            {grandTotalWithGSTCalculate(netTotal, totalDiscount, totalGST)}
          </Text>
        </View>
      </View>
    </TouchableRipple>
  )
}
