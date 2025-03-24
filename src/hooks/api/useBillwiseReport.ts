import axios from "axios"
import { ADDRESSES } from "../../config/api_list"
import { BillwiseResponse } from "../../models/api_types"

export default function useBillwiseReport() {
    const fetchBillwiseReport = async (
        fromDate: string,
        userId: number,
    ) => {
        return new Promise<PromiseLike<BillwiseResponse>>((resolve, reject) => {
            axios
                .post(`${ADDRESSES.BILLWISE_REPORT}`, {
                    from_date: fromDate,
                    user_id: userId,
                })
                .then(res => {
                    resolve(res.data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
    return { fetchBillwiseReport }
}
