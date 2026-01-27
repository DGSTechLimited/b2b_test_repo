import Link from "next/link";
import Clock from "lucide-react/dist/esm/icons/clock";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import PhoneCall from "lucide-react/dist/esm/icons/phone-call";
import Tag from "lucide-react/dist/esm/icons/tag";
import Truck from "lucide-react/dist/esm/icons/truck";

export function TopInfoBar() {
  return (
    <div className="bg-accent-600 text-white">
      <div className="mx-auto max-w-6xl px-6 py-2 text-xs font-semibold">
        <div className="grid w-full items-center gap-y-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-x-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <span>
                Open Hours: <span className="font-bold">24/7</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-orange-400" />
              <span>Live Chat</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-orange-400" />
              <span>Call Support</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2">
              <Tag className="h-4 w-4 text-orange-400" />
              <span>
                Super Value Deals -{" "}
                <Link href="/portal/parts" className="text-orange-400 hover:text-orange-100">
                  Shop Now
                </Link>
              </span>
            </div>
          </div>
          <div className="flex items-center sm:justify-end">
            <div className="inline-flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-400" />
              <span>Fast and Free Shipping all over Europe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
