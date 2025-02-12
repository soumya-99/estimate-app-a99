import React, { useContext, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  ToastAndroid,
} from "react-native";
import HeaderImage from "../../components/HeaderImage";
import { blurReport, blurReportDark } from "../../resources/images";
import { usePaperColorScheme } from "../../theme/theme";
import { List, Text } from "react-native-paper";
import DatePicker from "react-native-date-picker";
import ButtonPaper from "../../components/ButtonPaper";
import normalize, { SCREEN_HEIGHT } from "react-native-normalize";
import { formattedDate } from "../../utils/dateFormatter";
import { loginStorage } from "../../storage/appStorage";
import SurfacePaper from "../../components/SurfacePaper";
import { useBluetoothPrint } from "../../hooks/printables/useBluetoothPrint";
import { AppStore } from "../../context/AppContext";
import useProductwiseSaleReport from "../../hooks/api/useProductwiseSaleReport";

function ProductwiseSaleReportScreen() {
  const theme = usePaperColorScheme();

  const loginStore = JSON.parse(loginStorage.getString("login-data"));

  const { receiptSettings } = useContext(AppStore);

  const { fetchProductwiseSaleReport } = useProductwiseSaleReport();
  const { printProductwiseSaleReport } = useBluetoothPrint();

  const [productwiseSaleReport, setProductwiseSaleReport] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // For pagination

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const formattedFromDate = formattedDate(new Date());
  const formattedToDate = formattedDate(new Date());

  const handleGetSaleReport = async (
    fromDate,
    toDate,
    companyId,
    branchId
  ) => {
    if (fromDate > toDate) {
      ToastAndroid.show("From date must be lower than To date.", ToastAndroid.SHORT);
      return;
    }
    const saleCreds = {
      from_date: fromDate,
      to_date: toDate,
      comp_id: companyId,
      br_id: branchId,
      user_id: loginStore?.user_id,
    };
    setIsDisabled(true);
    setIsLoading(true);
    await fetchProductwiseSaleReport(saleCreds)
      .then((res) => {
        setProductwiseSaleReport(res?.data);
        setCurrentPage(1); // Reset pagination to the first page on new data fetch
      })
      .catch((err) => {
        ToastAndroid.show("Error fetching sale report.", ToastAndroid.SHORT);
      });
    setIsDisabled(false);
    setIsLoading(false);
  };

  const handlePrint = (saleReport, fromDate, toDate, currentPage) => {
    if (saleReport.length !== 0) {
      printProductwiseSaleReport(saleReport, fromDate, toDate, currentPage);
    } else {
      ToastAndroid.show("No Report Found!", ToastAndroid.SHORT);
      return;
    }
  };

  const itemsPerPage = 15;
  const totalPages = Math.ceil(productwiseSaleReport.length / itemsPerPage);
  const paginatedData = productwiseSaleReport.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center" }}>
          <HeaderImage
            isBackEnabled
            imgLight={blurReport}
            imgDark={blurReportDark}
            borderRadius={30}
            blur={10}
            showProductSearch={false}
          >
            Productwise Estimates
          </HeaderImage>
        </View>
        <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(10) }}>
          <ButtonPaper
            onPress={() =>
              handleGetSaleReport(
                formattedFromDate,
                formattedToDate,
                loginStore.comp_id,
                loginStore.br_id
              )
            }
            mode="contained-tonal"
            buttonColor={theme.colors.purple}
            textColor={theme.colors.onPurple}
            loading={isLoading}
            disabled={isDisabled}
          >
            SUBMIT
          </ButtonPaper>
        </View>

        {totalPages > 1 && (
          <>
            <View style={{
              paddingHorizontal: normalize(25),
              paddingBottom: 5
            }}>
              <Text>Page No:</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paginationContainer}>
              {Array.from({ length: totalPages }, (_, index) => (
                <>
                  <View key={index} style={styles.paginationButtonWrapper}>
                    <ButtonPaper
                      onPress={() => setCurrentPage(index + 1)}
                      mode={currentPage === index + 1 ? "contained" : "outlined"}
                      buttonColor={currentPage === index + 1 ? theme.colors.secondary : theme.colors.surface}
                      textColor={currentPage === index + 1 ? theme.colors.onPrimary : theme.colors.onSurface}
                      style={[styles.paginationButton, { shadowColor: theme.colors.primary }]}
                    >
                      {index + 1}
                    </ButtonPaper>
                  </View>
                  {/* <View>
                <Text>{">"}</Text>
              </View> */}
                </>
              ))}
            </ScrollView>
          </>
        )}

        <View style={{ paddingHorizontal: normalize(25), paddingBottom: normalize(10), maxHeight: SCREEN_HEIGHT / 1.85 }}>
          <ScrollView nestedScrollEnabled>
            {paginatedData.map((item, i) => (
              <List.Item
                key={i}
                title={() => (
                  <Text>
                    {item?.tot_item_qty}
                    {item?.unit_name?.charAt(0)} x {item?.item_name}
                  </Text>
                )}
                description={
                  <View>
                    <Text style={{ color: theme.colors.green }}>Price: ₹{item?.unit_price}</Text>
                    <Text style={{ color: theme.colors.purple }}>Category: {item?.category_name}</Text>
                  </View>
                }
                right={(props) => <Text>₹{item?.tot_item_price}</Text>}
              />
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(10) }}>
          <ButtonPaper
            icon={"cloud-print-outline"}
            onPress={() => handlePrint(paginatedData, formattedFromDate, formattedToDate, currentPage)}
            mode="contained-tonal"
            buttonColor={theme.colors.purpleContainer}
            textColor={theme.colors.onPurpleContainer}
          >
            PRINT
          </ButtonPaper>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProductwiseSaleReportScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: normalize(20)
  },
  paginationButtonWrapper: {
    marginHorizontal: normalize(5),
  },
  paginationButton: {
    borderRadius: normalize(20),
    elevation: 4,
    shadowOpacity: 0.25,
    shadowRadius: normalize(5),
    paddingHorizontal: normalize(10),
  },
});
