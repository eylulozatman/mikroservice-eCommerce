package com.example.productservice.filter;

import com.example.productservice.exception.ForbiddenException;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;

@Component
public class AdminWriteFilter implements Filter {

  private static final String ADMIN_HEADER = "X-IS-ADMIN";
  private static final String ADMIN_QUERY_PARAM = "isAdmin";
  private static final Set<String> WRITE_METHODS = Set.of("POST", "PUT", "DELETE");

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {

    HttpServletRequest req = (HttpServletRequest) request;

    if (WRITE_METHODS.contains(req.getMethod())) {
      boolean headerAdmin = "true".equalsIgnoreCase(req.getHeader(ADMIN_HEADER));
      boolean queryAdmin = "true".equalsIgnoreCase(req.getParameter(ADMIN_QUERY_PARAM));

      if (!(headerAdmin || queryAdmin)) {
        throw new ForbiddenException(
            "Admin required for write operations. Use header X-IS-ADMIN:true or query ?isAdmin=true"
        );
      }
    }

    chain.doFilter(request, response);
  }
}
