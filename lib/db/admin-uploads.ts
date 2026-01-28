import { prisma } from "@/lib/db/prisma";

export async function listCatalogPartsByType(type: "AFTERMARKET" | "GENUINE" | "BRANDED", page: number, pageSize: number) {
  const where = { partType: type };
  return Promise.all([
    prisma.catalogPart.count({ where }),
    prisma.catalogPart.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);
}

export async function getCatalogPartById(partId: string) {
  return prisma.catalogPart.findUnique({ where: { id: partId } });
}

export async function updateCatalogPart(partId: string, data: any) {
  // LLID: L-API-ADMIN-001-update-catalog-part
  return prisma.catalogPart.update({ where: { id: partId }, data });
}

export async function listOrderLineStatuses(page: number, pageSize: number) {
  return Promise.all([
    prisma.orderLineStatus.count(),
    prisma.orderLineStatus.findMany({
      orderBy: { statusDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { order: { select: { orderNumber: true } } }
    })
  ]);
}

export async function listSupersessions(page: number, pageSize: number) {
  return Promise.all([
    prisma.supersession.count(),
    prisma.supersession.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);
}

export async function getSupersessionById(id: string) {
  return prisma.supersession.findUnique({ where: { id } });
}

export async function updateSupersession(id: string, data: any) {
  // LLID: L-API-ADMIN-002-update-supersession
  return prisma.supersession.update({ where: { id }, data });
}
