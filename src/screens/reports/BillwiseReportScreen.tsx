import React from "react"
import {
    StyleSheet,
    ScrollView,
    SafeAreaView,
    View,
    ToastAndroid,
    TextStyle,
    ViewStyle,
    Alert,
} from "react-native"

import HeaderImage from "../../components/HeaderImage"
import { greenRep, greenRepDark } from "../../resources/images"
import { usePaperColorScheme } from "../../theme/theme"
import { DataTable, Text } from "react-native-paper"
import ButtonPaper from "../../components/ButtonPaper"
import { useContext, useState } from "react"
import normalize from "react-native-normalize"
import { formattedDate } from "../../utils/dateFormatter"
import { loginStorage } from "../../storage/appStorage"
import {
    // BasicReportCredentials,
    BillwiseReportData,
    // CancelledBillsReportData,
    SearchedBills,
    ShowBillData
} from "../../models/api_types"
import SurfacePaper from "../../components/SurfacePaper"
import { useBluetoothPrint } from "../../hooks/printables/useBluetoothPrint"
import useCancelledBillsReport from "../../hooks/api/useCancelledBillsReport"
import useBillwiseReport from "../../hooks/api/useBillwiseReport"
// import { AppStoreContext } from "../../models/custom_types"
// import { AppStore } from "../../context/AppContext"
import useShowBill from "../../hooks/api/useShowBill"
import useCancelBill from "../../hooks/api/useCancelBill"
import useCalculations from "../../hooks/useCalculations"
import DialogBoxForReprint from "../../components/DialogBoxForReprint"

function BillwiseReportScreen() {
    const theme = usePaperColorScheme()

    // const { receiptSettings } = useContext<AppStoreContext>(AppStore)
    const loginStore = JSON.parse(loginStorage.getString("login-data") as string)

    const [visible, setVisible] = useState(() => false)
    const hideDialog = () => setVisible(() => false)

    const { fetchBillwiseReport } = useBillwiseReport()
    const { fetchCancelledBills } = useCancelledBillsReport()
    const { printBillwiseReport, rePrintT } = useBluetoothPrint()
    const { fetchBill } = useShowBill()
    const { cancelBill } = useCancelBill()
    const {
        grandTotalCalculate,
        grandTotalWithGSTCalculate,
        grandTotalWithGSTInclCalculate,
    } = useCalculations()

    const [currentReceiptNo, setCurrentReceiptNo] = useState<string | undefined>(
        () => undefined,
    )
    const [reportData, setReportData] = useState<BillwiseReportData[]>(() => [])

    const [cancelledBillStatus, setCancelledBillStatus] = useState<"Y" | "N">()
    // const [billsArray, setBillsArray] = useState<SearchedBills[]>(() => [])
    const [billedSaleData, setBilledSaleData] = useState<ShowBillData[]>(() => [])

    const [isLoading, setIsLoading] = useState(() => false)
    const [isDisabled, setIsDisabled] = useState(() => false)

    const formattedFromDate = formattedDate(new Date())
    const formattedToDate = formattedDate(new Date())

    const handleGetCollectionReport = async (
        fromDate: string,
        toDate: string,
    ) => {
        if (fromDate > toDate) {
            ToastAndroid.show(
                "From date must be lower than To date.",
                ToastAndroid.SHORT,
            )
            return
        }

        setIsDisabled(true)
        setIsLoading(true)
        await fetchBillwiseReport(fromDate, loginStore?.user_id)
            .then(res => {
                setReportData(res?.data)
                console.log("XXXXXXXXXXXXXXXXX", res)
            })
            .catch(err => {
                ToastAndroid.show("Error during fetching report.", ToastAndroid.SHORT)
            })
        setIsDisabled(false)
        setIsLoading(false)
    }

    const handlePrint = (
        billwiseData: BillwiseReportData[],
        fromDate: string,
    ) => {
        if (billwiseData.length !== 0) {
            printBillwiseReport(billwiseData, fromDate)
        } else {
            ToastAndroid.show("No Report Found!", ToastAndroid.SHORT)
            return
        }
    }

    const handleGetBill = async (rcptNo: string) => {
        await fetchBill(rcptNo)
            .then(res => {
                setBilledSaleData(res?.data)
                setCancelledBillStatus(res?.cancel_flag)
            })
            .catch(err => {
                ToastAndroid.show("Error during fetching bills.", ToastAndroid.SHORT)
            })
    }

    const handleBillListClick = (rcptNo: string) => {
        setVisible(!visible)
        handleGetBill(rcptNo)
        setCurrentReceiptNo(rcptNo)
    }

    const onDialogFailure = () => {
        setVisible(!visible)
    }

    const onDialogSuccecss = () => {
        setVisible(!visible)
        // ToastAndroid.showWithGravityAndOffset(
        //   "Printing feature will be added in some days.",
        //   ToastAndroid.SHORT,
        //   ToastAndroid.CENTER,
        //   25,
        //   50,
        // )
        handleRePrintReceipt(false)
    }

    const handleRePrintReceipt = (cancelFlag: boolean) => {
        if (billedSaleData.length > 0) {
            rePrintT(
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
        } else {
            ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT)
            return
        }
    }

    const handleCancellingBill = async (rcptNo: string) => {
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

    const handleCancelBill = (rcptNo: string) => {
        Alert.alert(
            "Cancelling Estimate",
            `Are you sure you want to cancel this estimate?`,
            [
                { text: "BACK", onPress: () => null },
                { text: "CANCEL ESTIMATE", onPress: () => handleCancellingBill(rcptNo) },
            ],
            { cancelable: false },
        )
    }

    const titleTextStyle: TextStyle = {
        color: theme.colors.onGreenContainer
    }

    const titleStyle: ViewStyle = {
        backgroundColor: theme.colors.greenContainer
    }

    let totalNetAmount: number = 0
    let totalQty: number = 0

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <View style={{ alignItems: "center" }}>
                    <HeaderImage
                        isBackEnabled
                        imgLight={greenRep}
                        imgDark={greenRepDark}
                        borderRadius={30}
                        blur={10}>
                        Estimatewise Report
                    </HeaderImage>
                </View>

                <View
                    style={{
                        paddingHorizontal: normalize(20),
                        paddingBottom: normalize(10),
                    }}>
                    <ButtonPaper
                        onPress={() =>
                            handleGetCollectionReport(formattedFromDate, formattedToDate)
                        }
                        mode="contained-tonal"
                        buttonColor={theme.colors.green}
                        textColor={theme.colors.onGreen}
                        disabled={isDisabled}
                        loading={isLoading}>
                        SUBMIT
                    </ButtonPaper>
                </View>

                <SurfacePaper backgroundColor={theme.colors.surface}>
                    <DataTable>
                        <DataTable.Header style={titleStyle}>
                            <DataTable.Title textStyle={titleTextStyle}>Rcpt. No.</DataTable.Title>
                            <DataTable.Title textStyle={titleTextStyle}>Qty</DataTable.Title>
                            <DataTable.Title textStyle={titleTextStyle}>Total Amt.</DataTable.Title>
                        </DataTable.Header>

                        {reportData.map(item => {
                            totalNetAmount += item?.net_amt
                            totalQty += item?.qty

                            return (
                                <DataTable.Row key={item?.receipt_no}>
                                    <DataTable.Cell onPress={() => handleBillListClick(item?.receipt_no)}>
                                        {item?.receipt_no
                                            ?.toString()
                                            ?.substring(item?.receipt_no?.toString()?.length - 5)}
                                    </DataTable.Cell>
                                    <DataTable.Cell>{item?.qty}</DataTable.Cell>
                                    <DataTable.Cell>{item?.net_amt}</DataTable.Cell>
                                </DataTable.Row>
                            )
                        })}
                    </DataTable>
                    <View style={{ padding: normalize(10) }}>
                        <Text
                            variant="labelMedium"
                            style={{ color: theme.colors.secondary }}>
                            TOTAL QTY: {totalQty}  TOTAL AMT: ₹{totalNetAmount}
                        </Text>
                    </View>
                </SurfacePaper>
                <View
                    style={{
                        paddingHorizontal: normalize(20),
                        paddingBottom: normalize(10),
                    }}>
                    <ButtonPaper
                        icon={"cloud-print-outline"}
                        onPress={() =>
                            handlePrint(
                                reportData,
                                formattedFromDate,
                            )
                        }
                        mode="contained-tonal">
                        PRINT
                    </ButtonPaper>
                </View>
            </ScrollView>
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
                netTotalButtonColors={[theme.colors.vanillaContainer, theme.colors.onVanillaContainer]}
            />
        </SafeAreaView>
    )
}

export default BillwiseReportScreen

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },

    title: {
        textAlign: "center",
    },
})
