import Decoration from "../../components/decoration";

export default function Settings() {
    return (
        <div className="w-screen h-screen">
            <Decoration />
            <div className="flex flex-row gap-6 p-8 bg-gradient-to-br from-background from-40% via-[#121212] to-[#1a1520] overflow-hidden overscroll-none">

                <li className="flex flex-col gap-6">
                    <button className="">Music</button>
                </li>
                <div className="w-full h-full bg-blue-500">

                </div>
            </div>
        </div>
    )
}