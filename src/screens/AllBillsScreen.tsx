import React, { useContext, useState } from "react"
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  ToastAndroid,
} from "react-native"
import { List, Text } from "react-native-paper"
import HeaderImage from "../components/HeaderImage"
import { textureBill, textureBillDark } from "../resources/images"
import { usePaperColorScheme } from "../theme/theme"
import { useNavigation } from "@react-navigation/native"
import DialogBox from "../components/DialogBox"
import AddedProductList from "../components/AddedProductList"
import ScrollableListContainer from "../components/ScrollableListContainer"
import ButtonPaper from "../components/ButtonPaper"
import DatePicker from "react-native-date-picker"
import normalize from "react-native-normalize"
import useSearchBills from "../hooks/api/useSearchBills"
import { loginStorage } from "../storage/appStorage"
import { CalculatorShowBillData, SearchedBills, ShowBillData } from "../models/api_types"
import { formattedDate } from "../utils/dateFormatter"
import useShowBill from "../hooks/api/useShowBill"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import { AppStore } from "../context/AppContext"
import NetTotalForRePrints from "../components/NetTotalForRePrints"
import { Alert } from "react-native"
// import useCancelBill from "../hooks/api/useCancelBill"
import useCalculations from "../hooks/useCalculations"
import DialogBoxForReprint from "../components/DialogBoxForReprint"
import { AppStoreContext } from "../models/custom_types"
import useCancelBill from "../hooks/api/useCancelBill"
import DialogForBillsInCalculatorMode from "../components/DialogForBillsInCalculatorMode"
import useCalculatorShowBill from "../hooks/api/useCalculatorShowBill"

function AllBillsScreen() {
  const theme = usePaperColorScheme()
  const navigation = useNavigation()

  const loginStore = JSON.parse(loginStorage.getString("login-data"))

  const { receiptSettings } = useContext<AppStoreContext>(AppStore)

  const [visible, setVisible] = useState(() => false)
  const hideDialog = () => setVisible(() => false)

  const [visible2, setVisible2] = useState<boolean>(() => false)
  const hideDialog2 = () => setVisible2(() => false)

  const [fromDate, setFromDate] = useState(() => new Date())
  const [toDate, setToDate] = useState(() => new Date())
  const [openFromDate, setOpenFromDate] = useState(() => false)
  const [openToDate, setOpenToDate] = useState(() => false)
  const [currentReceiptNo, setCurrentReceiptNo] = useState<number | undefined>(
    () => undefined,
  )
  const [cancelledBillStatus, setCancelledBillStatus] = useState<"Y" | "N">()
  const [gstFlag, setGstFlag] = useState<"Y" | "N">()
  const [gstType, setGstType] = useState<"I" | "E">()
  const [discountType, setDiscountType] = useState<"P" | "A">()

  const formattedFromDate = formattedDate(fromDate)
  const formattedToDate = formattedDate(toDate)

  const [isLoading, setIsLoading] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(() => false)

  const [billsArray, setBillsArray] = useState<SearchedBills[]>(() => [])
  const [billedSaleData, setBilledSaleData] = useState<ShowBillData[]>(() => [])

  const [calculatorModeBillArray, setCalculatorModeBillArray] = useState<CalculatorShowBillData[]>(() => [])

  const { fetchSearchedBills } = useSearchBills()
  const { fetchBill } = useShowBill()
  const { cancelBill } = useCancelBill()
  const {
    grandTotalCalculate,
    grandTotalWithGSTCalculate,
    grandTotalWithGSTInclCalculate,
  } = useCalculations()
  const { fetchCalcBill } = useCalculatorShowBill()

  const { rePrint, rePrintWithoutGst, printDuplicateBillCalculateMode } = useBluetoothPrint()

  const handleGetBill = async (rcptNo: number) => {
    await fetchBill(rcptNo)
      .then(res => {
        setBilledSaleData(res?.data)
        setCancelledBillStatus(res?.cancel_flag)
      })
      .catch(err => {
        ToastAndroid.show("Error during fetching bills.", ToastAndroid.SHORT)
      })
  }

  const handleGetBillCalculatorMode = async (rcptNo: number) => {
    await fetchCalcBill(rcptNo).then(res => {
      setCalculatorModeBillArray(res?.data)
    })
  }

  const handleBillListClick = (rcptNo: number) => {
    setVisible(!visible)
    handleGetBill(rcptNo)
    setCurrentReceiptNo(rcptNo)
    setGstFlag(billedSaleData[0]?.gst_flag)
    setGstType(billedSaleData[0]?.gst_type)
  }

  const handleBillListClickCalculatorMode = (rcptNo: number) => {
    setVisible2(true)
    setCurrentReceiptNo(rcptNo)
    handleGetBillCalculatorMode(rcptNo)
  }

  const onDialogFailure = () => {
    setVisible(!visible)
  }

  const onDialogSuccecss = (calculatorMode = false) => {
    setVisible(false)

    if (!calculatorMode) {
      handleRePrintReceipt(false)
    } else {
      handleRePrintReceiptForCalculatorMode()
    }
  }

  const handleRePrintReceiptForCalculatorMode = () => {
    printDuplicateBillCalculateMode(calculatorModeBillArray).then(() => {
      hideDialog2()
    }).catch(err => {
      ToastAndroid.show("Some error while re-printing in Calculate mode.", ToastAndroid.SHORT)
    })
  }

  const handleRePrintReceipt = (cancelFlag: boolean) => {
    if (billedSaleData.length > 0) {
      gstFlag === "N"
        ? rePrintWithoutGst(
          billedSaleData,
          // netTotal,
          billedSaleData[0]?.tprice,
          // totalDiscount,
          billedSaleData[0]?.tdiscount_amt,
          billedSaleData[0]?.received_amt,
          billedSaleData[0]?.received_amt !== undefined
            ? billedSaleData[0]?.received_amt -
            grandTotalCalculate(billedSaleData[0]?.tprice, billedSaleData[0]?.tdiscount_amt)
            : 0,
          billedSaleData[0]?.cust_name,
          billedSaleData[0]?.phone_no,
          billedSaleData[0]?.receipt_no,
          billedSaleData[0]?.pay_mode,
          false,
          false,
          cancelFlag,
        )
        : gstType === "E"
          ? rePrint(
            billedSaleData,
            // netTotal,
            billedSaleData[0]?.tprice,
            // totalDiscount,
            billedSaleData[0]?.tdiscount_amt,
            billedSaleData[0]?.received_amt,
            billedSaleData[0]?.received_amt !== undefined
              ? billedSaleData[0]?.received_amt -
              parseFloat(
                grandTotalWithGSTCalculate(
                  billedSaleData[0]?.tprice,
                  billedSaleData[0]?.tdiscount_amt,
                  billedSaleData[0]?.tcgst_amt * 2,
                ),
              )
              : 0,
            billedSaleData[0]?.cust_name,
            billedSaleData[0]?.phone_no,
            billedSaleData[0]?.receipt_no,
            billedSaleData[0]?.pay_mode,
            false,
            false,
            cancelFlag,
          )
          : rePrint(
            billedSaleData,
            // netTotal,
            billedSaleData[0]?.tprice,
            // totalDiscount,
            billedSaleData[0]?.tdiscount_amt,
            billedSaleData[0]?.received_amt,
            billedSaleData[0]?.received_amt !== undefined
              ? billedSaleData[0]?.received_amt -
              parseFloat(
                grandTotalWithGSTInclCalculate(billedSaleData[0]?.tprice, billedSaleData[0]?.tdiscount_amt),
              )
              : 0,
            billedSaleData[0]?.cust_name,
            billedSaleData[0]?.phone_no,
            billedSaleData[0]?.receipt_no,
            billedSaleData[0]?.pay_mode,
            false,
            false,
            cancelFlag,
          )
    } else {
      ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT)
      return
    }
  }

  const handleGetBillsByDate = async (fromDate: string, toDate: string) => {
    setIsDisabled(true)
    setIsLoading(true)
    let billResponseData = await fetchSearchedBills(
      fromDate,
      toDate,
      loginStore.comp_id,
      loginStore.br_id,
      loginStore.user_id,
    )
    console.log("$$$$$$$$$########", billResponseData)
    // console.log("$$$$$$$$$######## loginStore.comp_id", loginStore.comp_id)
    // console.log("$$$$$$$$$######## loginStore.br_id", loginStore.br_id)
    // console.log("$$$$$$$$$######## loginStore.user_id", loginStore.user_id)
    setBillsArray(billResponseData?.data)
    setIsDisabled(false)
    setIsLoading(false)
  }

  const handleCancellingBill = async (rcptNo: number) => {
    await cancelBill(rcptNo, loginStore.user_id).then(res => {
      if (res?.status === 1) {
        ToastAndroid.show(res?.data, ToastAndroid.SHORT)
        handleRePrintReceipt(true)
        setVisible(!visible)
      }
    }).catch(err => {
      ToastAndroid.show(`Error occurred during cancelling bill. ${err}`, ToastAndroid.SHORT)
      setVisible(!visible)
    })
  }

  const handleCancelBill = (rcptNo: number) => {
    Alert.alert("Cancelling Bill", `Are you sure you want to cancel this bill?`, [
      { text: "BACK", onPress: () => ToastAndroid.show("Operation cancelled by user.", ToastAndroid.SHORT) },
      { text: "CANCEL BILL", onPress: () => handleCancellingBill(rcptNo) },
    ],
      { cancelable: false },
    )
  }

  let netTotal = 0
  let totalDiscount = 0

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <View style={{ alignItems: "center" }}>
          <HeaderImage
            imgLight={textureBill}
            imgDark={textureBillDark}
            borderRadius={30}
            blur={10}
            isBackEnabled>
            My Bills
          </HeaderImage>
        </View>

        <View
          style={{
            padding: 10,
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}>
          <ButtonPaper onPress={() => setOpenFromDate(true)} mode="text">
            FROM: {fromDate?.toLocaleDateString("en-GB")}
          </ButtonPaper>
          <ButtonPaper onPress={() => setOpenToDate(true)} mode="text">
            TO: {toDate?.toLocaleDateString("en-GB")}
          </ButtonPaper>

          <DatePicker
            modal
            mode="date"
            // minimumDate={toDate.setMonth(toDate.getMonth() - 1)}
            open={openFromDate}
            date={fromDate}
            onConfirm={date => {
              setOpenFromDate(false)
              setFromDate(date)
            }}
            onCancel={() => {
              setOpenFromDate(false)
            }}
          />
          <DatePicker
            modal
            mode="date"
            open={openToDate}
            date={toDate}
            onConfirm={date => {
              setOpenToDate(false)
              setToDate(date)
            }}
            onCancel={() => {
              setOpenToDate(false)
            }}
          />
        </View>

        <View
          style={{
            paddingHorizontal: normalize(20),
            paddingBottom: normalize(10),
          }}>
          <ButtonPaper
            onPress={() =>
              handleGetBillsByDate(formattedFromDate, formattedToDate)
            }
            mode="contained-tonal"
            loading={isLoading}
            disabled={isDisabled}>
            SUBMIT
          </ButtonPaper>
        </View>

        <View style={{ width: "100%" }}>
          {billsArray?.map((item, i) => (
            <List.Item
              key={i}
              title={`Bill ${item?.receipt_no}`}
              description={`₹${item?.net_amt}`}
              onPress={() => {
                loginStore?.mode !== "C"
                  ? handleBillListClick(item?.receipt_no)
                  : handleBillListClickCalculatorMode(item?.receipt_no)
              }}
              left={props => <List.Icon {...props} icon="basket" />}
            // right={props => (
            //   <List.Icon {...props} icon="download" />
            // )}
            />
          ))}
        </View>
      </ScrollView>
      {/* <DialogBoxForReprint
        iconSize={30}
        visible={visible}
        hide={hideDialog}
        titleStyle={styles.title}
      // title="Print Bill"
      >
        <View style={{ paddingBottom: 5 }}>
          <Text
            style={{ textAlign: "center", color: theme.colors.primary }}
            variant="bodyLarge">
            {currentReceiptNo}
          </Text>
          <Text
            style={{ textAlign: "center", color: theme.colors.secondary }}
            variant="bodyLarge">
            {new Date(billedSaleData[0]?.created_dt).toLocaleString("en-GB")}
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderStyle: "dashed",
              width: "80%",
              borderColor: theme.colors.secondary,
              alignSelf: "center",
            }}></View>
          {billedSaleData[0]?.cust_name && (
            <Text
              style={{ textAlign: "center", color: theme.colors.primary }}
              variant="bodyLarge">
              {billedSaleData[0]?.cust_name}
            </Text>
          )}
          <Text
            style={{ textAlign: "center", color: theme.colors.secondary }}
            variant="bodyLarge">
            {billedSaleData[0]?.phone_no}
          </Text>
          <Text
            style={{ textAlign: "center", color: theme.colors.peach }}
            variant="bodyLarge">
            Payment Mode: {`[${billedSaleData[0]?.pay_mode === "C" ? "Cash" : billedSaleData[0]?.pay_mode === "D" ? "Card" : billedSaleData[0]?.pay_mode === "U" ? "UPI" : billedSaleData[0]?.pay_mode === "R" ? "Credit" : "Error!"}]`}
          </Text>
        </View>
        <ScrollableListContainer
          backgroundColor={theme.colors.surfaceVariant}
          height={250}
          width={300}>
          {billedSaleData?.map((item, i) => {
            // console.log("billedSaleData - item.item_name", item.item_name)
            // console.log("billedSaleData - item.qty", item.qty)
            // console.log("billedSaleData - item.price", item.price)
            netTotal += item.price * item.qty

            // item?.discount_type === "P"
            //   ? totalDiscount += item?.discount_amt
            //   : totalDiscount += item?.discount_amt * item?.qty

            // item?.discount_type === "P"
            //   ? totalDiscount += item?.tdiscount_amt

            //   : totalDiscount += item?.tdiscount_amt

            totalDiscount = item?.tdiscount_amt
            console.log(
              "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$",
              totalDiscount,
            )
            //@ts-ignore
            // totalDiscount += item?.discount_amt
            return (
              <AddedProductList
                disabled
                itemName={item.item_name}
                quantity={item.qty}
                // unit={item.unit}
                unitPrice={item.price}
                discount={
                  item?.discount_flag === "Y" && item?.discount_position !== "B"
                    ? item?.discount_type === "P"
                      ? item?.dis_pertg
                      : item?.discount_amt
                    : 0
                }
                discountType={item?.discount_type}
                gstFlag={item?.gst_flag}
                key={i}
              />
            )
          })}
        </ScrollableListContainer>
        <NetTotalForRePrints
          width={300}
          backgroundColor={theme.colors.primaryContainer}
          textColor={theme.colors.onPrimaryContainer}
          addedProductsList={billedSaleData}
          netTotal={netTotal}
          totalDiscount={totalDiscount}
          disabled
        />
        <View style={{ paddingTop: normalize(10) }}>
          <ButtonPaper icon="cancel" mode="contained-tonal" onPress={() => handleCancelBill(currentReceiptNo)} buttonColor={theme.colors.error} textColor={theme.colors.onError}>
            CANCEL BILL
          </ButtonPaper>
        </View>
        <View
          style={{
            justifyContent: "space-between",
            flexDirection: "row",
            paddingTop: 10,
          }}>
          <ButtonPaper
            mode="text"
            onPress={onDialogFailure}
            textColor={theme.colors.error}>
            Cancel
          </ButtonPaper>
          <ButtonPaper
            mode="text"
            onPress={onDialogSuccecss}
            textColor={theme.colors.primary}>
            Reprint
          </ButtonPaper>
        </View>
      </DialogBoxForReprint> */}

      <DialogBoxForReprint
        iconSize={30}
        visible={visible}
        hide={hideDialog}
        titleStyle={styles.title}

        currentReceiptNo={currentReceiptNo}
        billedSaleData={billedSaleData}
        handleCancelBill={handleCancelBill}
        cancelledBillStatus={cancelledBillStatus}

        onDialogFailure={onDialogFailure}
        onDialogSuccecss={onDialogSuccecss}
        netTotalButtonColors={[theme.colors.primaryContainer, theme.colors.onPrimaryContainer]}
      />

      <DialogForBillsInCalculatorMode
        visible={visible2}
        hide={hideDialog2}

        currentReceiptNumber={currentReceiptNo}
        showCalculatedBillData={calculatorModeBillArray}

        onDialogFailure={hideDialog2}
        onDialogSuccecss={() => onDialogSuccecss(true)}
      />
    </SafeAreaView>
  )
}

export default AllBillsScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  title: {
    textAlign: "center",
  },
})
