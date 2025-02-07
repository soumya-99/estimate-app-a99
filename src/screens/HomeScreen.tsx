import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  ToastAndroid,
  RefreshControl,
  Alert,
  Linking,
} from "react-native"
import React, { useCallback, useContext, useEffect, useState } from "react"
import SplashScreen from "react-native-splash-screen"
import AnimatedFABPaper from "../components/AnimatedFABPaper"
import {
  ActivityIndicator,
  Button,
  Dialog,
  List,
  MD2Colors,
  Portal,
  SegmentedButtons,
  Text,
  TouchableRipple,
} from "react-native-paper"
import { usePaperColorScheme } from "../theme/theme"
import HeaderImage from "../components/HeaderImage"
import {
  flowerGlass,
  flowerGlassDark,
  flowerHome,
  flowerHomeDark,
  hills,
  hillsDark,
} from "../resources/images"
import navigationRoutes from "../routes/navigationRoutes"
import {
  CommonActions,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native"
import SurfacePaper from "../components/SurfacePaper"
import DialogBox from "../components/DialogBox"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import ScrollableListContainer from "../components/ScrollableListContainer"
import { loginStorage } from "../storage/appStorage"
import { CalculatorShowBillData, LoginData, LoginDataMessage, RecentBillsData, ShowBillData } from "../models/api_types"
import { AppStore } from "../context/AppContext"
import useBillSummary from "../hooks/api/useBillSummary"
import useRecentBills from "../hooks/api/useRecentBills"
import useShowBill from "../hooks/api/useShowBill"
import useCalculatorShowBill from "../hooks/api/useCalculatorShowBill"
import AddedProductList from "../components/AddedProductList"
import NetTotalForRePrints from "../components/NetTotalForRePrints"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import useVersionCheck from "../hooks/api/useVersionCheck"
import DeviceInfo from "react-native-device-info"
import ButtonPaper from "../components/ButtonPaper"
import useCancelBill from "../hooks/api/useCancelBill"
import useCalculations from "../hooks/useCalculations"
import DialogBoxForReprint from "../components/DialogBoxForReprint"
import DialogForBillsInCalculatorMode from "../components/DialogForBillsInCalculatorMode"
import { AppStoreContext } from "../models/custom_types"
import { ADDRESSES } from "../config/api_list"
import { NativeModules } from 'react-native';

function HomeScreen() {
  const theme = usePaperColorScheme()
  const navigation = useNavigation()
  const isFocused = useIsFocused()

  let version = DeviceInfo.getVersion()

  const { handleGetReceiptSettings } = useContext<AppStoreContext>(AppStore)

  const { fetchBillSummary } = useBillSummary()
  const { fetchRecentBills } = useRecentBills()
  const { fetchBill } = useShowBill()
  const { fetchVersionInfo } = useVersionCheck()
  const { printDuplicateBillCalculateMode, rePrintT } = useBluetoothPrint()
  const { cancelBill } = useCancelBill()
  const { fetchCalcBill } = useCalculatorShowBill()
  const {
    grandTotalCalculate,
    grandTotalWithGSTCalculate,
    grandTotalWithGSTInclCalculate,
  } = useCalculations()

  const loginStore = JSON.parse(loginStorage.getString("login-data")) as LoginDataMessage
  // let loginStore

  // try {
  //   const loginData = loginStorage.getString("login-data")

  //   loginStore = loginData ? JSON.parse(loginData) : {}
  // } catch (error) {
  //   console.error("Failed to parse login-data:", error)
  //   loginStore = {}
  // }

  const [isExtended, setIsExtended] = useState<boolean>(() => true)

  const [totalBills, setTotalBills] = useState<number | undefined>(
    () => undefined,
  )
  const [amountCollected, setAmountCollected] = useState<number | undefined>(
    () => undefined,
  )
  const [recentBills, setRecentBills] = useState<RecentBillsData[]>(() => [])
  const [billedSaleData, setBilledSaleData] = useState<ShowBillData[]>(() => [])
  const [currentReceiptNo, setCurrentReceiptNo] = useState<string | undefined>(
    () => undefined,
  )
  const [cancelledBillStatus, setCancelledBillStatus] = useState<"Y" | "N">()
  const [gstFlag, setGstFlag] = useState<"Y" | "N">()
  const [gstType, setGstType] = useState<"I" | "E">()

  const [refreshing, setRefreshing] = useState<boolean>(() => false)
  const [updateUrl, setUpdateUrl] = useState<string>()

  const [visible, setVisible] = useState<boolean>(() => false)
  const hideDialog = () => setVisible(() => false)

  const [visible2, setVisible2] = useState<boolean>(() => false)
  const hideDialog2 = () => setVisible2(() => false)

  const [visibleUpdatePortal, setVisibleUpdatePortal] = useState<boolean>(
    () => false,
  )

  const [calculatorModeBillArray, setCalculatorModeBillArray] = useState<CalculatorShowBillData[]>(() => [])

  const showDialogForAppUpdate = () => setVisibleUpdatePortal(true)
  const hideDialogForAppUpdate = () => setVisibleUpdatePortal(false)

  let today = new Date()
  let year = today.getFullYear()
  let month = ("0" + (today.getMonth() + 1)).slice(-2)
  let day = ("0" + today.getDate()).slice(-2)
  let formattedDate = year + "-" + month + "-" + day

  // let netTotal = 0
  // let totalDiscount = 0

  useEffect(() => {
    SplashScreen.hide()

    return () => SplashScreen.hide()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    handleGetReceiptSettings()
    // handleGetBillSummary()
    handleGetRecentBills()
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }, [])

  const onScroll = ({ nativeEvent }) => {
    const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0

    setIsExtended(currentScrollPosition <= 0)
  }

  const onDialogFailure = () => {
    setVisible(false)
  }

  const onDialogSuccecss = (calculatorMode = false) => {
    setVisible(false)

    if (!calculatorMode) {
      handleRePrintReceipt(false)
    } else {
      handleRePrintReceiptForCalculatorMode()
    }
  }

  const handleRePrintReceipt = (cancelFlag: boolean) => {
    if (billedSaleData.length > 0) {
      // gstFlag === "N"
      //   ? rePrintWithoutGst(
      //     billedSaleData,
      //     // netTotal,
      //     billedSaleData[0]?.tprice,
      //     // totalDiscount,
      //     billedSaleData[0]?.tdiscount_amt,
      //     billedSaleData[0]?.received_amt,
      //     billedSaleData[0]?.received_amt !== undefined
      //       ? billedSaleData[0]?.received_amt -
      //       grandTotalCalculate(billedSaleData[0]?.tprice, billedSaleData[0]?.tdiscount_amt)
      //       : 0,
      //     billedSaleData[0]?.cust_name,
      //     billedSaleData[0]?.phone_no,
      //     billedSaleData[0]?.receipt_no,
      //     billedSaleData[0]?.pay_mode,
      //     false,
      //     false,
      //     cancelFlag,
      //   )
      //   : gstType === "E"
      //     ? rePrint(
      //       billedSaleData,
      //       // netTotal,
      //       billedSaleData[0]?.tprice,
      //       // totalDiscount,
      //       billedSaleData[0]?.tdiscount_amt,
      //       billedSaleData[0]?.received_amt,
      //       billedSaleData[0]?.received_amt !== undefined
      //         ? billedSaleData[0]?.received_amt -
      //         parseFloat(
      //           grandTotalWithGSTCalculate(
      //             billedSaleData[0]?.tprice,
      //             billedSaleData[0]?.tdiscount_amt,
      //             billedSaleData[0]?.tcgst_amt * 2,
      //           ),
      //         )
      //         : 0,
      //       billedSaleData[0]?.cust_name,
      //       billedSaleData[0]?.phone_no,
      //       billedSaleData[0]?.receipt_no,
      //       billedSaleData[0]?.pay_mode,
      //       false,
      //       false,
      //       cancelFlag,
      //     )
      //     : rePrint(
      //       billedSaleData,
      //       // netTotal,
      //       billedSaleData[0]?.tprice,
      //       // totalDiscount,
      //       billedSaleData[0]?.tdiscount_amt,
      //       billedSaleData[0]?.received_amt,
      //       billedSaleData[0]?.received_amt !== undefined
      //         ? billedSaleData[0]?.received_amt -
      //         parseFloat(
      //           grandTotalWithGSTInclCalculate(billedSaleData[0]?.tprice, billedSaleData[0]?.tdiscount_amt),
      //         )
      //         : 0,
      //       billedSaleData[0]?.cust_name,
      //       billedSaleData[0]?.phone_no,
      //       billedSaleData[0]?.receipt_no,
      //       billedSaleData[0]?.pay_mode,
      //       false,
      //       false,
      //       cancelFlag,
      //     )

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

  const handleRePrintReceiptForCalculatorMode = () => {
    printDuplicateBillCalculateMode(calculatorModeBillArray).then(() => {
      hideDialog2()
    }).catch(err => {
      ToastAndroid.show("Some error while re-printing in Calculate mode.", ToastAndroid.SHORT)
    })
  }

  // const handleGetBillSummary = async () => {
  //   await fetchBillSummary(
  //     formattedDate,
  //     loginStore.comp_id,
  //     loginStore.br_id,
  //     loginStore.user_id,
  //   )
  //     .then(res => {
  //       setTotalBills(res?.data[0]?.total_bills)
  //       setAmountCollected(res?.data[0]?.amount_collected)
  //     })
  //     .catch(err => {
  //       ToastAndroid.show(
  //         "Check your internet connection or something went wrong in the server.",
  //         ToastAndroid.SHORT,
  //       )
  //       console.log("handleGetBillSummary - HomeScreen", err, formattedDate)
  //     })
  // }

  const handleGetRecentBills = async () => {
    await fetchRecentBills(
      formattedDate,
      loginStore.comp_id,
      loginStore.br_id,
      loginStore.user_id,
    )
      .then(res => {
        setRecentBills(res)
      })
      .catch(err => {
        ToastAndroid.show(
          "Error during fetching recent bills.",
          ToastAndroid.SHORT,
        )
      })
  }

  const handleGetVersion = async () => {
    await fetchVersionInfo()
      .then(res => {
        if (parseFloat(res?.data[0]?.version_no) > parseFloat(version)) {
          showDialogForAppUpdate()
          // Alert.alert("UPDATE FOUND!", "Please update your app.")
        }
        setUpdateUrl(res?.data[0]?.url)
      })
      .catch(err => {
        ToastAndroid.show(
          "Error during getting version info.",
          ToastAndroid.SHORT,
        )
      })
  }

  useEffect(() => {
    // handleGetBillSummary()
    handleGetRecentBills()

    handleGetVersion()
  }, [isFocused])

  const updateApp = () => {
    Linking.openURL(updateUrl)
  }

  const handleGetBill = async (rcptNo: string) => {
    await fetchBill(rcptNo)
      .then(res => {
        setBilledSaleData(res?.data)
        setCancelledBillStatus(res?.cancel_flag)
        console.log("handleGetBill - HOMESCREEN - fetchBill", res?.data)
      })
      .catch(err => {
        ToastAndroid.show("Error during fetching old bill", ToastAndroid.SHORT)
      })
  }

  const handleGetBillCalculatorMode = async (rcptNo: string) => {
    await fetchCalcBill(rcptNo).then(res => {
      setCalculatorModeBillArray(res?.data)
    })
  }

  const handleRecentBillListClick = (rcptNo: string) => {
    setVisible(true)
    handleGetBill(rcptNo)
    setCurrentReceiptNo(rcptNo)
    setGstFlag(billedSaleData[0]?.gst_flag)
    setGstType(billedSaleData[0]?.gst_type)
  }

  const handleBillListClickCalculatorMode = (rcptNo: string) => {
    setVisible2(true)
    setCurrentReceiptNo(rcptNo)
    handleGetBillCalculatorMode(rcptNo)
  }

  const handleCancellingBill = async (rcptNo: string) => {
    await cancelBill(rcptNo, loginStore.user_id).then(res => {
      if (res?.status === 1) {
        // ToastAndroid.show(res?.data, ToastAndroid.SHORT)
        Alert.alert("Alert", "Estimate cancelled.")
        console.log("++++++++++++++++++++++-----------------------", res)
        handleRePrintReceipt(true)
        setVisible(false)
      }
    }).catch(err => {
      // ToastAndroid.show(`Error occurred during cancelling bill. ${err}`, ToastAndroid.SHORT)
      console.log("uireeeeeeeeeeee wtucrsduyrtgsueyctuwe", err)
      setVisible(false)
    })

    // handleGetBillSummary()
    handleGetRecentBills()
  }

  const handleCancelBill = (rcptNo: string) => {
    Alert.alert(
      "Cancelling Bill",
      `Are you sure you want to cancel this bill?`,
      [
        { text: "BACK", onPress: () => null },
        { text: "CANCEL BILL", onPress: () => handleCancellingBill(rcptNo) },
      ],
      { cancelable: false },
    )
  }

  let totalQty: number = 0


  const { ReceiptPrinter } = NativeModules;

  const base64String = "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDYuMC1jMDAyIDc5LjE2NDQ4OCwgMjAyMC8wNy8xMC0yMjowNjo1MyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjM3NkM4RkZBNTIyRDExRUU4Q0U0RDA5NkZDRkExMkVFIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjM3NkM4RkZCNTIyRDExRUU4Q0U0RDA5NkZDRkExMkVFIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6Mzc2QzhGRjg1MjJEMTFFRThDRTREMDk2RkNGQTEyRUUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6Mzc2QzhGRjk1MjJEMTFFRThDRTREMDk2RkNGQTEyRUUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4+PW/5AABfS0lEQVR42uydB7wc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";

  const handlePrint = () => {
    ReceiptPrinter.initializeEzeAPI((message) => {
      console.log(message);
      if (message === "Initialization successful") {
        ReceiptPrinter.printCustomReceipt(base64String, (message) => {
          console.log(message);
        });
      }
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        onScroll={onScroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={{ alignItems: "center" }}>
          <HeaderImage
            imgLight={hills}
            imgDark={hillsDark}
            borderRadius={30}
            blur={10}>
            Welcome Back, Estimate!
          </HeaderImage>
        </View>

        {/* <View
          style={{
            alignSelf: "center",
            width: "85%",
            marginTop: -9,
            paddingBottom: normalize(10),
          }}>
          <ButtonPaper
            icon="magnify-scan"
            mode="contained"
            buttonColor={theme.colors.purpleContainer}
            onPress={() => navigation.dispatch(
              CommonActions.navigate(
                {
                  name: navigationRoutes.categoryProductsScreen,
                  params: {
                    category_id: 0,
                    category_name: "All Items",
                    category_photo: ""
                  }
                }
              )
            )}
            textColor={theme.colors.onPurpleContainer}>
            SEARCH PRODUCTS
          </ButtonPaper>
        </View> */}

        <Portal>
          <Dialog visible={visibleUpdatePortal} dismissable={false}>
            <Dialog.Title>UPDATE FOUND!</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Please update your app.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              {/* <Button onPress={hideDialog}>Cancel</Button> */}
              <Button onPress={updateApp}>Download</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <View style={{ alignItems: "center", marginTop: -10 }}>
          {/* <SurfacePaper
            smallWidthEnabled
            borderRadiusEnabled={false}
            paddingEnabled
            elevation={1}
            backgroundColor={theme.colors.peachContainer}
            style={{
              borderTopRightRadius: normalize(30),
              borderTopLeftRadius: normalize(30),
            }}>
            <View style={{ width: "100%", padding: normalize(15) }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}>
                <View>
                  <Text variant="titleLarge" style={{
                    color: theme.colors.onPeachContainer
                  }}>Amount Collected</Text>
                </View>
                <View>
                  <Text variant="titleLarge" style={{
                    color: theme.colors.onPeachContainer
                  }}>₹{amountCollected}</Text>
                </View>
              </View>
            </View>
          </SurfacePaper> */}

          <SurfacePaper
            smallWidthEnabled
            borderRadiusEnabled={false}
            paddingEnabled
            isBorderEnabled
            heading="Recent Activities"
            elevation={1}
            backgroundColor={theme.colors.tertiaryContainer}
            style={{
              borderBottomLeftRadius: normalize(30),
              borderBottomRightRadius: normalize(30),
            }}>
            <View style={{ width: "100%" }}>
              {recentBills?.map((item, i) => (
                <List.Item
                  key={i}
                  title={`${item?.receipt_no}`}
                  description={`₹${item?.net_amt}`}
                  onPress={() => {
                    loginStore?.mode !== "C"
                      ? handleRecentBillListClick(item?.receipt_no)
                      : handleBillListClickCalculatorMode(item?.receipt_no)
                  }}
                  // onPress={() => null}
                  left={props => <List.Icon {...props} icon="basket" />}
                // right={props => (
                //   <List.Icon {...props} icon="download" />
                // )}
                />
              ))}
            </View>
            {/* <View>
              <Button
                textColor={theme.colors.onPinkContainer}
                onPress={() =>
                  navigation.dispatch(
                    CommonActions.navigate({
                      name: navigationRoutes.allBillsScreen,
                    }),
                  )
                }>
                ALL BILLS
              </Button>
            </View> */}
            <View>
              <Button
                textColor={theme.colors.onPinkContainer}
                onPress={handlePrint}>
                TEST
              </Button>
            </View>
          </SurfacePaper>
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
        onDialogSuccecss={() => onDialogSuccecss()}
      />

      <DialogForBillsInCalculatorMode
        visible={visible2}
        hide={hideDialog2}

        currentReceiptNumber={currentReceiptNo}
        showCalculatedBillData={calculatorModeBillArray}

        onDialogFailure={hideDialog2}
        onDialogSuccecss={() => onDialogSuccecss(true)}
      />

      {/* {
        loginStore?.mode === "N"
          ? <AnimatedFABPaper
            icon="plus"
            label="Bill"
            onPress={() =>
              navigation.dispatch(
                CommonActions.navigate({
                  name: navigationRoutes.productsScreen,
                }),
              )
            }
            extended={isExtended}
            animateFrom="right"
            iconMode="dynamic"
            customStyle={styles.fabStyle}
          />
          : <AnimatedFABPaper
            icon="pencil-plus-outline"
            label="Bill"
            onPress={() =>
              navigation.dispatch(
                CommonActions.navigate({
                  name: navigationRoutes.calculateModeBillScreen,
                }),
              )
            }
            extended={isExtended}
            animateFrom="right"
            iconMode="dynamic"
            customStyle={styles.fabStyle}
          />
      } */}


      {
        loginStore?.mode !== "C" && <>
          <AnimatedFABPaper
            color={theme.colors.onPeachContainer}
            variant="tertiary"
            icon="apps"
            label="Categories"
            onPress={() =>
              navigation.dispatch(
                CommonActions.navigate({
                  name: navigationRoutes.categoriesScreen,
                }),
              )
            }
            extended={isExtended}
            animateFrom="right"
            iconMode="dynamic"
            customStyle={[styles.fabStyle, { backgroundColor: theme.colors.peachContainer }]}
          />
        </>
      }

    </SafeAreaView>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  title: {
    textAlign: "center",
  },

  bill: {
    margin: normalize(20),
    padding: normalize(10),
    // minHeight: 200,
    height: "auto",
    maxHeight: "auto",
    borderRadius: normalize(30),
    width: normalize(320),
    alignItems: "center",
  },

  fabStyle: {
    bottom: normalize(16),
    right: normalize(16),
    position: "absolute",
  },

  fabStyle2: {
    bottom: normalize(16),
    left: normalize(16),
    position: "absolute",
  },
})
